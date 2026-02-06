"""Amazon S3 storage service for image uploads and signed URLs."""
import os
import mimetypes
from typing import Optional
import boto3
from botocore.exceptions import ClientError


class S3Storage:
    """Thin S3 wrapper for uploads and signed URLs."""

    def __init__(self, bucket: str, region: str, prefix: str = ""):
        self.bucket = bucket
        self.region = region
        self.prefix = prefix.strip("/") if prefix else ""
        self.client = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        )

    @classmethod
    def from_env(cls) -> "S3Storage":
        bucket = os.environ.get("AWS_S3_BUCKET")
        region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION")
        prefix = os.environ.get("AWS_S3_PREFIX", "")
        if not bucket or not region:
            raise RuntimeError("AWS_S3_BUCKET and AWS_REGION must be set")
        return cls(bucket=bucket, region=region, prefix=prefix)

    def _with_prefix(self, key: str) -> str:
        if not self.prefix:
            return key
        return f"{self.prefix}/{key}"

    def upload_bytes(self, key: str, data: bytes, content_type: Optional[str] = None) -> str:
        object_key = self._with_prefix(key)
        if not content_type:
            content_type, _ = mimetypes.guess_type(object_key)
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
        self.client.put_object(
            Bucket=self.bucket,
            Key=object_key,
            Body=data,
            **extra_args,
        )
        return f"s3://{self.bucket}/{object_key}"

    def generate_signed_url(self, key: str, expires_in: int = 3600) -> str:
        object_key = self._with_prefix(key)
        try:
            return self.client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": self.bucket, "Key": object_key},
                ExpiresIn=expires_in,
            )
        except ClientError as exc:
            raise RuntimeError(f"Failed to generate signed URL: {exc}")
