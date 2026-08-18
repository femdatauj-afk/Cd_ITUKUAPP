# S3 Storage Provider Setup Guide

## Overview
The ITUKUAPP file upload system supports both **local filesystem** and **AWS S3** storage backends. The provider is selected via the `MEDIA_STORAGE_PROVIDER` environment variable.

## Environment Configuration

### Local Storage (Default)
```env
MEDIA_STORAGE_PROVIDER=local
MEDIA_CDN_BASE_URL=http://localhost:3001
MEDIA_STORAGE_BUCKET=itukuapp-media
```

**Storage Location:** `./public/uploads/`

### AWS S3 Storage
```env
MEDIA_STORAGE_PROVIDER=s3
MEDIA_STORAGE_BUCKET=your-s3-bucket-name
MEDIA_CDN_BASE_URL=https://your-cloudfront-domain.cloudfront.net
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

## AWS S3 Setup Instructions

### 1. Create an S3 Bucket

```bash
aws s3api create-bucket \
  --bucket itukuapp-media \
  --region us-east-1
```

For regions other than us-east-1:
```bash
aws s3api create-bucket \
  --bucket itukuapp-media \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1
```

### 2. Configure Bucket Policies

Set public-read ACL for unauthenticated access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::itukuapp-media/*"
    }
  ]
}
```

### 3. Enable CORS (Optional, for Browser Uploads)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 4. Create IAM User for Application

Create a programmatic access user with S3 permissions:

```bash
aws iam create-user --user-name itukuapp-media-uploader

aws iam attach-user-policy \
  --user-name itukuapp-media-uploader \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam create-access-key --user-name itukuapp-media-uploader
```

Store the returned `AccessKeyId` and `SecretAccessKey` in your `.env` file.

### 5. Configure CloudFront (Optional, Recommended for Production)

Create a CloudFront distribution pointing to your S3 bucket for faster CDN delivery:

1. **Create Distribution:**
   - Origin Domain: `itukuapp-media.s3.us-east-1.amazonaws.com`
   - Restrict bucket access: Yes
   - Create origin access control (OAC)

2. **Update Bucket Policy** to allow CloudFront OAC access

3. **Set CDN URL:**
   ```env
   MEDIA_CDN_BASE_URL=https://d123abc.cloudfront.net
   ```

## File Organization in S3

Files are organized by directory and user:

```
s3://itukuapp-media/
├── profiles/{userId}/
│   └── profile-photo-{timestamp}-{random}.jpg
├── covers/{userId}/
│   └── cover-photo-{timestamp}-{random}.jpg
├── marketplace/{userId}/
│   └── listing-image-{timestamp}-{random}.jpg
└── general/{userId}/
    └── file-{timestamp}-{random}.pdf
```

## API Endpoints

### Generic Upload
```
POST /api/upload?directory=profiles
Content-Type: multipart/form-data

file: <binary data>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "http://localhost:3001/profiles/user-id/profile-photo-1234567890-abcd1234.jpg",
    "key": "profiles/user-id/profile-photo-1234567890-abcd1234.jpg",
    "filename": "my-photo.jpg",
    "mimetype": "image/jpeg",
    "size": 102400
  }
}
```

### Profile Photo Upload
```
POST /api/upload/profile-photo
Content-Type: multipart/form-data

file: <binary image data>
```

Max size: 5MB
Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

### Cover Photo Upload
```
POST /api/upload/cover-photo
Content-Type: multipart/form-data

file: <binary image data>
```

Max size: 10MB
Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

### Marketplace Image Upload
```
POST /api/upload/marketplace
Content-Type: multipart/form-data

file: <binary image data>
```

Max size: 10MB
Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

## File Validation Rules

| Upload Type | Max Size | MIME Types |
|-------------|----------|-----------|
| Generic | 50MB | image/*, video/*, audio/*, application/pdf |
| Profile Photo | 5MB | image/jpeg, image/png, image/webp |
| Cover Photo | 10MB | image/jpeg, image/png, image/webp |
| Marketplace | 10MB | image/jpeg, image/png, image/webp, image/gif |

## Error Handling

### Upload Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | No file provided | Ensure multipart/form-data with `file` field |
| 400 Bad Request | File type not allowed | Use allowed MIME type |
| 400 Bad Request | File too large | Reduce file size below limit |
| 413 Payload Too Large | Request body exceeds limit | Reduce file size |
| 500 Internal Server Error | S3 credentials missing | Ensure AWS credentials in .env |
| 500 Internal Server Error | S3 bucket not found | Verify bucket name and AWS permissions |

## Testing

### Local Storage Test

```bash
curl -X POST http://localhost:4000/api/upload/profile-photo \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "file=@/path/to/image.jpg"
```

### S3 Storage Test

Ensure environment variables are set:
```bash
export MEDIA_STORAGE_PROVIDER=s3
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
npm run start:dev
```

Then make the same request as local storage test.

## Performance Optimization

### Recommended Settings

1. **Image Optimization**: Consider adding an image processing step before upload
   ```bash
   npm install sharp
   ```

2. **Multi-part Upload**: For large files (>100MB), use S3 multipart upload
   - Implemented in S3StorageProvider via aws-sdk v3

3. **Caching Headers**: Configure S3 cache control
   ```bash
   aws s3 cp file.jpg s3://bucket/path/file.jpg \
     --cache-control "max-age=31536000"
   ```

4. **CloudFront Settings**:
   - Cache TTL: 1 year for versioned files
   - Compress: Enable Gzip compression
   - HTTPS: Enforce for all connections

## Troubleshooting

### S3 Provider Not Initialized
- Check AWS credentials are in environment
- Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
- Provider gracefully falls back to local storage if credentials missing

### 403 Access Denied
- Verify IAM user has S3FullAccess policy
- Check bucket policy allows the IAM user
- Ensure Access Key ID and Secret Key are correct

### Files Not Accessible
- Verify bucket has public-read ACL
- Check CloudFront distribution status if using CDN
- Verify CORS configuration for browser uploads

### Slow Upload Speeds
- Use CloudFront CDN for downloads
- Implement client-side image compression before upload
- Consider S3 Transfer Acceleration for uploads

## Switching Providers at Runtime

To switch from local to S3:

1. Update `.env` file:
   ```env
   MEDIA_STORAGE_PROVIDER=s3
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   ```

2. Restart application:
   ```bash
   npm run start:dev
   ```

3. Existing local files won't be automatically migrated. Consider creating a migration script if needed.

## Backup and Recovery

### Backup S3 Bucket
```bash
aws s3 sync s3://itukuapp-media ./local-backup/
```

### Restore S3 Bucket
```bash
aws s3 sync ./local-backup/ s3://itukuapp-media/
```

## Security Best Practices

1. **Restrict Public Access**: Use OAC with CloudFront instead of public bucket ACL
2. **Rotate Access Keys**: Regularly rotate AWS access keys
3. **Versioning**: Enable S3 versioning for important files
4. **Encryption**: Enable default S3 encryption (AES-256)
5. **Logging**: Enable S3 access logging for audit trail
6. **Lifecycle Policies**: Delete old temporary files automatically

```bash
# Enable versioning
aws s3api put-bucket-versioning \
  --bucket itukuapp-media \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket itukuapp-media \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Enable logging
aws s3api put-bucket-logging \
  --bucket itukuapp-media \
  --bucket-logging-status file://logging.json
```

## References

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for Node.js](https://docs.aws.amazon.com/sdk-for-javascript/)
- [NestJS File Uploading](https://docs.nestjs.com/techniques/file-upload)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
