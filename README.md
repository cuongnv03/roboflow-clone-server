# RoboFlow Clone – Local Development with Docker

This guide helps you set up and run both the frontend and backend of RoboFlow Clone using Docker Compose.

## 📁 Folder Structure

Clone the repositories and arrange the folder structure like this:

```

project-root/
│
├── roboflow-clone-client/      # Frontend (Vue.js)
└── roboflow-clone-server/      # Backend (Node.js + Express)

````

## 🚀 Quick Start

### 1. Clone the repositories

```bash
git clone https://github.com/cuongnv03/roboflow-clone-client.git
git clone https://github.com/cuongnv03/roboflow-clone-server.git
````

Move both folders into the same parent directory (`project-root/`).

### 2. Create folder (`database/init`) in this parent directory and in already created folder, create `01-init.sql` to initialize database

  ```sql
  -- Create the database
  CREATE DATABASE IF NOT EXISTS roboflow_clone;
  USE roboflow_clone;
  
  -- Enable InnoDB for transactional support and foreign key constraints
  SET FOREIGN_KEY_CHECKS = 1;
  
  -- Table: Users
  CREATE TABLE IF NOT EXISTS Users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
  );
  
  -- Table: Projects
  CREATE TABLE IF NOT EXISTS Projects (
      project_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      type ENUM('object_detection', 'classification', 'instance_segmentation', 'keypoint_detection', 'multimodal') NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
  );
  
  -- Table: Classes
  CREATE TABLE IF NOT EXISTS Classes (
      class_id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      name VARCHAR(50) NOT NULL,
      color VARCHAR(7) DEFAULT '#000000',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE CASCADE
  );
  
  -- Table: Images
  CREATE TABLE IF NOT EXISTS Images (
      image_id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      file_path VARCHAR(255) NOT NULL,
      original_filename VARCHAR(255) NOT NULL,
      width INT NOT NULL,
      height INT NOT NULL,
      upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status ENUM('uploaded', 'annotated', 'processed') NOT NULL DEFAULT 'uploaded',
      FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE CASCADE
  );
  
  -- Table: Annotations
  CREATE TABLE IF NOT EXISTS Annotations (
      annotation_id INT AUTO_INCREMENT PRIMARY KEY,
      image_id INT NOT NULL,
      class_id INT NOT NULL,
      annotation_data JSON NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      is_valid BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (image_id) REFERENCES Images(image_id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES Classes(class_id) ON DELETE CASCADE
  );
  
  CREATE TABLE IF NOT EXISTS Datasets (
    dataset_id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    preprocessing_settings JSON,
    augmentation_settings JSON,
    status ENUM('pending', 'generating', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE CASCADE
  );
  
  CREATE TABLE IF NOT EXISTS Dataset_Images (
    dataset_id INT NOT NULL,
    image_id INT NOT NULL,
    split ENUM('train', 'valid', 'test') NOT NULL,
    PRIMARY KEY (dataset_id, image_id),
    FOREIGN KEY (dataset_id) REFERENCES Datasets(dataset_id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES Images(image_id) ON DELETE CASCADE
  );
  
  -- Indexes for performance
  CREATE INDEX idx_users_email ON Users(email);
  CREATE INDEX idx_projects_user_id ON Projects(user_id);
  CREATE INDEX idx_classes_project_id ON Classes(project_id);
  CREATE INDEX idx_images_project_id ON Images(project_id);
  CREATE INDEX idx_annotations_image_id ON Annotations(image_id);
  CREATE INDEX idx_annotations_class_id ON Annotations(class_id);
  CREATE INDEX idx_datasets_project_id ON Datasets(project_id);
  
  -- Add batch_name column to Images table
  ALTER TABLE Images ADD COLUMN batch_name VARCHAR(100) DEFAULT NULL;
  ```

### 3. Create environment files

* **Frontend**: In `roboflow-clone-client/`, create `.env.development` by copying from `.env.example`:

  ```bash
  cp roboflow-clone-client/.env.example roboflow-clone-client/.env.development
  ```

* **Backend**: In the project root (alongside both folders), create `.env` by copying from the backend’s example:

  ```bash
  cp roboflow-clone-server/.env.example .env
  ```

  Make sure to update any secrets (e.g., `JWT_SECRET`) as needed.

### 4. Create `docker-compose.yml`

In the project root (`project-root/`), create a file named `docker-compose.yml` with the following contents:

```yaml
version: '3.9'

services:
  # MySQL Database
  database:
    image: mysql:8.0
    container_name: roboflow_db_dev
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: roboflow_clone
      MYSQL_USER: roboflow_user
      MYSQL_PASSWORD: roboflow_user_password
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - roboflow-network

  # Backend API
  backend:
    build:
      context: ./roboflow-clone-server
      dockerfile: Dockerfile
    container_name: roboflow_backend_dev
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 5000
      DB_HOST: database
      DB_PORT: 3306
      DB_USER: roboflow_user
      DB_PASSWORD: roboflow_user_password
      DB_NAME: roboflow_clone
      JWT_SECRET: your_jwt_secret_key
      JWT_EXPIRES_IN: 86400
      STORAGE_TYPE: local
      UPLOAD_DIR: uploads
      UPLOAD_BASE_URL: /uploads
    ports:
      - '5000:5000'
    volumes:
      - ./roboflow-clone-server:/app
      - /app/node_modules
      - uploads_data:/app/uploads
    depends_on:
      - database
    networks:
      - roboflow-network

  # Frontend
  frontend:
    build:
      context: ./roboflow-clone-client
      dockerfile: Dockerfile
    container_name: roboflow_frontend_dev
    restart: unless-stopped
    environment:
      VITE_API_URL: http://localhost:5000/api/v1
    ports:
      - '5173:5173'
    volumes:
      - ./roboflow-clone-client:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - roboflow-network

volumes:
  mysql_data:
  uploads_data:

networks:
  roboflow-network:
    driver: bridge
```

### 45. Start Docker containers

Make sure Docker Desktop is running, then from the project root run:

```bash
docker-compose up --build
```

This will:

* Build and start a MySQL container (`roboflow_db_dev`) on port `3306`.
* Build and start the backend (`roboflow_backend_dev`) on port `5000`.
* Build and start the frontend (`roboflow_frontend_dev`) on port `5173`.

#### Available Endpoints

* **Frontend**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
* **MySQL**: Host = `localhost`, Port = `3306`, User = `roboflow_user`, Password = `roboflow_user_password`, Database = `roboflow_clone`

## 🔧 Notes & Tips

* If you change any environment variables, you must restart the containers:

  ```bash
  docker-compose down
  docker-compose up --build
  ```

* To view database initialization scripts, place any `.sql` files under `./database/init/`. They will run automatically when the MySQL container first starts.

* Logs for each service can be viewed by specifying the service name:

  ```bash
  docker-compose logs backend
  docker-compose logs frontend
  docker-compose logs database
  ```

* To stop all containers:

  ```bash
  docker-compose down
  ```

## ✅ Ready to Develop

With these steps completed, your local environment is fully set up. You can now:

1. Open `roboflow-clone-client/` in your code editor and start modifying/reacting to changes.
2. Open `roboflow-clone-server/` to adjust API routes, models, or business logic.
3. Interact with the database on `localhost:3306` using your preferred MySQL client.

Happy coding!
