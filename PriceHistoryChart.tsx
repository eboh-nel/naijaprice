DATABASE_URL=postgresql://naijaprice:naijaprice@db/naijaprice
REDIS_URL=redis://redis:6379/0
SECRET_KEY=change-me-in-production
DEBUG=true
SCRAPE_DELAY_MIN=1.5
SCRAPE_DELAY_MAX=4.0
STALE_THRESHOLD_HOURS=24

# Email alerts — uses Brevo / Mailgun / Gmail SMTP
# Leave blank to use mock mode (alerts logged to console)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=alerts@naijaprice.ng
