import { Request, Response, NextFunction } from "express";
import { IAuthService } from "../../domain/services/IAuthService";
import { asyncHandler } from "../middlewares/asyncHandler";
import { UserRegisterDTO, UserLoginDTO } from "../../domain/dtos/user.dto";

export class AuthController {
  constructor(private authService: IAuthService) {}

  register = asyncHandler(async (req: Request, res: Response) => {
    const userData: UserRegisterDTO = req.body;
    const result = await this.authService.register(userData);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: result,
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const credentials: UserLoginDTO = req.body;
    const result = await this.authService.login(credentials);

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: result,
    });
  });
}
