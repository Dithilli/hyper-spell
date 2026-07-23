#!/bin/bash
# Provision the HyperSpell game instance in the company AWS account.
# ── REVIEW BEFORE RUNNING — this creates real (cheap, tagged) resources. ──
# Creates: 1 key pair, 1 security group, 1 t4g.small (~$12/mo). Nothing else.
# (small, not micro: since v9 the sim runs ON this box — micro's burst credits
# could make a long session mushy)
# Usage:
#   ./deploy/provision.sh              # Option B posture: 80/443 open, 22 from your IP
#   OPEN_WEB=no ./deploy/provision.sh  # Option A posture: 22 from your IP only (join tailnet after)
set -euo pipefail

PROFILE=hyperspell
REGION=us-west-2
NAME=hyperspell-game
TYPE=${TYPE:-t4g.small}
OPEN_WEB=${OPEN_WEB:-yes}
KEY_FILE="$HOME/.ssh/${NAME}.pem"
cd "$(dirname "$0")"

echo "About to create key pair + security group + $TYPE instance '$NAME' in $REGION (account: $(aws sts get-caller-identity --profile $PROFILE --query Account --output text))."
read -rp "Continue? [y/N] " yn; [[ $yn == y* ]] || exit 1

# latest Ubuntu 24.04 arm64 AMI via Canonical's SSM parameter
AMI=$(aws ssm get-parameter --profile $PROFILE --region $REGION \
  --name /aws/service/canonical/ubuntu/server/24.04/stable/current/arm64/hvm/ebs-gp3/ami-id \
  --query Parameter.Value --output text)
echo "AMI: $AMI"

# key pair (skipped if it exists locally)
if [ ! -f "$KEY_FILE" ]; then
  aws ec2 create-key-pair --profile $PROFILE --region $REGION --key-name $NAME \
    --query KeyMaterial --output text > "$KEY_FILE"
  chmod 600 "$KEY_FILE"
  echo "key pair saved: $KEY_FILE"
fi

MYIP=$(curl -s https://checkip.amazonaws.com)
SG=$(aws ec2 create-security-group --profile $PROFILE --region $REGION \
  --group-name $NAME --description "HyperSpell team game relay" \
  --query GroupId --output text)
aws ec2 authorize-security-group-ingress --profile $PROFILE --region $REGION \
  --group-id "$SG" --protocol tcp --port 22 --cidr "$MYIP/32"
if [ "$OPEN_WEB" = yes ]; then
  aws ec2 authorize-security-group-ingress --profile $PROFILE --region $REGION \
    --group-id "$SG" --protocol tcp --port 443 --cidr 0.0.0.0/0
  aws ec2 authorize-security-group-ingress --profile $PROFILE --region $REGION \
    --group-id "$SG" --protocol tcp --port 80 --cidr 0.0.0.0/0   # ACME http-01
fi

ID=$(aws ec2 run-instances --profile $PROFILE --region $REGION \
  --image-id "$AMI" --instance-type $TYPE --key-name $NAME \
  --security-group-ids "$SG" --user-data file://cloud-init.sh \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$NAME},{Key=Project,Value=$NAME},{Key=Owner,Value=david@hyperspell.com}]" \
  --query 'Instances[0].InstanceId' --output text)
echo "instance: $ID — waiting for it to come up…"
aws ec2 wait instance-running --profile $PROFILE --region $REGION --instance-ids "$ID"
IP=$(aws ec2 describe-instances --profile $PROFILE --region $REGION --instance-ids "$ID" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

echo
echo "  instance $ID is up at $IP"
echo "  cloud-init needs ~2 min, then:  ./deploy/push.sh $IP"
