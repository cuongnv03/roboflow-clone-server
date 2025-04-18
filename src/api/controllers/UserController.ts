import { Request, Response } from "express";
import { IUserService } from "../../domain/services/IUserService";
import { UserUpdateDTO } from "../../domain/dtos/user.dto";
import { asyncHandler } from "../middlewares/asyncHandler";

export class UserController {
  constructor(private userService: IUserService) {}

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const profile = await this.userService.getProfile(req.user.id);

    res.status(200).json({
      status: "success",
      message: "User profile retrieved successfully",
      data: profile,
    });
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const updateData: UserUpdateDTO = req.body;
    const updatedProfile = await this.userService.updateProfile(
      req.user.id,
      updateData,
    );

    res.status(200).json({
      status: "success",
      message: "User profile updated successfully",
      data: updatedProfile,
    });
  });
}
