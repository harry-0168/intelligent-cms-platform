import os

import boto3


def _get_s3():
    return boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION"),
    )


def upload(image_bytes: bytes, filename: str, folder: str = "cms-hero-images") -> str:
    bucket = os.getenv("S3_BUCKET_NAME")
    if not bucket:
        raise RuntimeError("S3_BUCKET_NAME is missing")

    key = f"{folder}/{filename}"

    _get_s3().put_object(
        Bucket=bucket,
        Key=key,
        Body=image_bytes,
        ContentType="image/png",
        ACL="public-read",
    )

    region = os.getenv("AWS_REGION", "us-east-1")
    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
