import { Request, Response } from "express";
import pool from "../config/database";
import s3 from "../config/s3";
import { Image } from "../types";
import sharp from "sharp";

interface AuthRequest extends Request {
  user?: { user_id: number; username: string };
  file?: Express.Multer.File;
}

export const uploadImage = async (req: AuthRequest, res: Response) => {
  const { project_id } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const [project] = await pool.query(
      "SELECT * FROM Projects WHERE project_id = ? AND workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?)",
      [project_id, req.user!.user_id],
    );
    if ((project as any[]).length === 0)
      return res.status(404).json({ error: "Project not found" });

    const fileName = `${Date.now()}-${file.originalname}`;
    const key = `projects/${project_id}/${fileName}`;

    // Get image dimensions
    const metadata = await sharp(file.buffer).metadata();

    // Upload to S3
    const params = {
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "private",
    };
    const uploadResult = await s3.upload(params).promise();

    const fileUrl = uploadResult.Location;

    const [result] = await pool.query(
      "INSERT INTO Images (project_id, file_path, original_filename, width, height, uploaded_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        project_id,
        fileUrl,
        file.originalname,
        metadata.width,
        metadata.height,
        req.user!.user_id,
        "uploaded",
      ],
    );

    const image: Image = {
      image_id: (result as any).insertId,
      project_id: Number(project_id),
      file_path: fileUrl,
      original_filename: file.originalname,
      width: metadata.width!,
      height: metadata.height!,
      upload_date: new Date().toISOString(),
      uploaded_by: req.user!.user_id,
      status: "uploaded",
    };

    res.status(201).json(image);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};

export const getImages = async (req: AuthRequest, res: Response) => {
  const { project_id } = req.params;
  const { status } = req.query;

  try {
    const query = status
      ? "SELECT * FROM Images WHERE project_id = ? AND status = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))"
      : "SELECT * FROM Images WHERE project_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))";
    const params = status
      ? [project_id, status, req.user!.user_id]
      : [project_id, req.user!.user_id];

    const [images] = await pool.query(query, params);
    res.status(200).json(images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
