# MeloTech Backend - Mailgun Integration

This backend service integrates Mailgun email notifications with Supabase database webhooks to automatically send emails when submission statuses are updated.

## Features

- **Mailgun Integration**: Sends professional email notifications for submission status updates
- **Supabase Webhooks**: Listens for database changes on the submissions table
- **Email Templates**: Beautiful HTML and text email templates for different statuses (accepted, rejected, pending)
- **Security**: Webhook signature verification for secure communication
- **User Lookup**: Automatically retrieves user email addresses from Supabase auth

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_FROM_EMAIL=noreply@your_mailgun_domain

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret_key
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Configure Supabase Webhook

In your Supabase dashboard:

1. Go to Database → Webhooks
2. Create a new webhook with the following settings:
   - **Name**: Submission Status Update
   - **Table**: submissions
   - **Events**: Update
   - **HTTP Method**: POST
   - **URL**: `http://your-backend-url/webhook/submission-status-update`
   - **HTTP Headers**:
     - `Content-Type: application/json`
     - `X-Signature: your_webhook_secret_key` (optional, for security)

### 5. Mailgun Setup

1. Sign up for a Mailgun account at https://www.mailgun.com/
2. Verify your domain
3. Get your API key from the Mailgun dashboard
4. Add the credentials to your `.env` file

## API Endpoints

### Webhook Endpoint

- **POST** `/webhook/submission-status-update` - Handles Supabase webhook notifications

### Health Check

- **GET** `/health` - Returns service health status

## Email Templates

The service sends different email templates based on submission status:

- **Accepted**: Congratulatory message with green styling
- **Rejected**: Professional rejection message with feedback
- **Pending**: Notification that submission is under review

## Database Schema Requirements

The service expects the following Supabase tables:

### submissions table

- `id` (primary key)
- `userid` (foreign key to auth.users.id)
- `title` (submission title)
- `status` (pending, accepted, rejected)
- `feedback` (optional feedback text)
- Other fields as needed

### auth.users table

- `id` (user ID)
- `email` (user email address)

## Security Features

- Webhook signature verification using HMAC-SHA256
- Environment variable configuration for sensitive data
- Error handling and logging

## Testing

You can test the webhook endpoint by sending a POST request with a sample payload:

```json
{
  "type": "UPDATE",
  "table": "submissions",
  "record": {
    "id": "123",
    "userid": "user-uuid",
    "title": "Test Submission",
    "status": "accepted",
    "feedback": "Great work!"
  },
  "old_record": {
    "id": "123",
    "userid": "user-uuid",
    "title": "Test Submission",
    "status": "pending",
    "feedback": ""
  }
}
```

## Troubleshooting

1. **Email not sending**: Check Mailgun API key and domain configuration
2. **Webhook not triggering**: Verify Supabase webhook URL and table configuration
3. **User email not found**: Ensure the userid in submissions matches auth.users.id
4. **Signature verification failing**: Check WEBHOOK_SECRET configuration

## Logs

The service logs important events including:

- Email sending success/failure
- Webhook processing
- User lookup results
- Error messages
