# Banki Mahotsav

| Folder | App | Dev URL |
| --- | --- | --- |
| `mahotsav_citizen/` | Public site | http://localhost:5173 |
| `mahotsav_admin/` | Admin panel | http://localhost:5174 |
| `mahotsav_backend/` | Express API + **MySQL** | http://localhost:5000 |

## MySQL

1. Start MySQL (XAMPP, MySQL Server, or Docker).
2. Copy env file and set your password:

```bash
copy mahotsav_backend\.env.example mahotsav_backend\.env
```

Edit `mahotsav_backend/.env`:

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=banki_mahotsav
```

On first start the API creates the `banki_mahotsav` database, tables, and seed data.

## Run

```bash
npm install
npm install --prefix mahotsav_backend
npm run dev
```

## Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@bankimahotsav.com | admin123 |
| Devotee | devotee@bankimahotsav.com | devotee123 |
