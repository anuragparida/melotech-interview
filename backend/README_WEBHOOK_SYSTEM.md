# MeloTech Real-time Webhook System

This document describes the real-time webhook system implemented for the MeloTech application, which provides live updates to the admin dashboard when submissions are modified.

## Overview

The system consists of:

1. **Backend WebSocket Service** - Manages real-time connections
2. **Webhook Handlers** - Process database change notifications
3. **Frontend WebSocket Hooks** - Connect to real-time updates
4. **Admin Dashboard Integration** - Display live updates

## Architecture

```
Supabase Database → Webhook → Backend API → WebSocket → Frontend Admin Dashboard
```

## Components

### 1. Backend WebSocket Service (`services/websocket_service.py`)

Manages WebSocket connections with room-based broadcasting:

- **Admin Room**: All admin dashboard connections
- **Artist Room**: Individual artist connections
- **Connection Management**: Auto-reconnection, error handling
- **Message Broadcasting**: Real-time submission updates

### 2. Webhook Handlers (`handlers/webhook_handler.py`)

Processes database change notifications:

- **Submission Status Updates**: Email notifications via Mailgun
- **Real-time Updates**: WebSocket broadcasting to admin dashboard
- **Security**: Webhook signature verification
- **Error Handling**: Graceful failure handling

### 3. API Endpoints (`routes/api_routes.py`)

- `POST /webhook/submission-status-update` - Email notifications
- `POST /webhook/submission-update` - Real-time updates
- `WS /ws/admin` - Admin WebSocket connection
- `WS /ws/artist/{user_id}` - Artist WebSocket connection
- `GET /health` - System health with connection stats

### 4. Frontend WebSocket Hooks

#### `useWebSocket` (`lib/hooks/useWebSocket.ts`)

Generic WebSocket hook with:

- Auto-reconnection
- Connection status tracking
- Message handling
- Error recovery

#### `useAdminWebSocket` (`lib/hooks/useAdminWebSocket.ts`)

Admin-specific hook for:

- Submission update handling
- Connection status notifications
- Toast notifications for updates

## Setup Instructions

### 1. Backend Setup

1. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

2. Set environment variables:

```bash
# .env file
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
WEBHOOK_SECRET=your_webhook_secret
MAILGUN_API_KEY=your_mailgun_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
```

3. Start the backend server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Supabase Webhook Configuration

1. Go to Supabase Dashboard → Database → Webhooks
2. Create a new webhook for the `submissions` table
3. Set the webhook URL to: `https://your-backend-url.com/webhook/submission-update`
4. Configure to trigger on INSERT, UPDATE, DELETE
5. Set the webhook secret in your environment variables

### 3. Frontend Setup

1. Set the backend URL in your environment:

```bash
# .env file
VITE_BACKEND_URL=http://localhost:8000
```

2. The admin dashboard will automatically connect to WebSocket on load

## Testing

Run the test script to verify the system:

```bash
cd backend
python test_webhook_realtime.py
```

This will test:

- WebSocket connection
- Webhook endpoint
- Health endpoint
- Message broadcasting

## Usage

### Admin Dashboard

The admin dashboard automatically:

1. Connects to WebSocket on page load
2. Shows connection status indicator
3. Receives real-time updates when submissions change
4. Displays toast notifications for updates
5. Updates the UI without page refresh

### Connection Status

The admin dashboard shows:

- 🟢 **Live Updates** - Connected and receiving updates
- 🔴 **Offline** - Disconnected or connection failed

### Real-time Updates

When a submission is updated, the admin dashboard will:

1. Receive WebSocket message
2. Update the specific submission in the list
3. Show toast notification
4. Maintain all existing functionality

## Security

- **Webhook Signature Verification**: All webhooks verify HMAC signatures
- **WebSocket Authentication**: Connections are validated
- **CORS Configuration**: Proper cross-origin setup
- **Rate Limiting**: Built-in connection limits

## Monitoring

### Health Endpoint

Check system health:

```bash
curl http://localhost:8000/health
```

Response includes:

- Service status
- Active WebSocket connections
- Active rooms
- Feature availability

### Logs

Monitor logs for:

- WebSocket connections/disconnections
- Webhook processing
- Error messages
- Performance metrics

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**

   - Check backend URL configuration
   - Verify backend server is running
   - Check network connectivity

2. **No Real-time Updates**

   - Verify Supabase webhook configuration
   - Check webhook endpoint logs
   - Ensure WebSocket connection is active

3. **Connection Drops**
   - Check network stability
   - Verify auto-reconnection is working
   - Check backend server health

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=1
```

## Performance Considerations

- **Connection Limits**: Monitor active connections
- **Message Frequency**: Limit update frequency if needed
- **Memory Usage**: Clean up disconnected connections
- **Network Bandwidth**: Optimize message payload size

## Future Enhancements

- **User-specific Updates**: Filter updates by user
- **Update History**: Track change history
- **Batch Updates**: Group multiple changes
- **Mobile Support**: WebSocket for mobile apps
- **Analytics**: Track usage patterns
