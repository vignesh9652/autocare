-- Create databases for each service
CREATE DATABASE IF NOT EXISTS autocare_users;
CREATE DATABASE IF NOT EXISTS vehicle_db;
CREATE DATABASE IF NOT EXISTS mechanic_db;
CREATE DATABASE IF NOT EXISTS booking_db;
CREATE DATABASE IF NOT EXISTS spareparts_db;
CREATE DATABASE IF NOT EXISTS payment_db;
CREATE DATABASE IF NOT EXISTS review_db;

-- Grant privileges (root already exists from MYSQL_ROOT_PASSWORD env var)
GRANT ALL PRIVILEGES ON autocare_users.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON vehicle_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON mechanic_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON booking_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON spareparts_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON payment_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON review_db.* TO 'root'@'%';
FLUSH PRIVILEGES;
