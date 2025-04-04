-- Create the database
CREATE DATABASE IF NOT EXISTS roboflow_clone;
USE roboflow_clone;

-- Enable InnoDB for transactional support and foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;

-- Table: Users
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table: Projects
CREATE TABLE Projects (
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
CREATE TABLE Classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#000000',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE CASCADE
);

-- Table: Images
CREATE TABLE Images (
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
CREATE TABLE Annotations (
    annotation_id INT AUTO_INCREMENT PRIMARY KEY,
    image_id INT NOT NULL,
    class_id INT NOT NULL,
    annotation_data JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_valid BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (image_id) REFERENCES Images(image_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES Classes(class_id) ON DELETE CASCADE
);

CREATE TABLE Datasets (
  dataset_id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  preprocessing_settings JSON,
  augmentation_settings JSON,
  status ENUM('pending', 'generating', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE CASCADE
);

CREATE TABLE Dataset_Images (
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
