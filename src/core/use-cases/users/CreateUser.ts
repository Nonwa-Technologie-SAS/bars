import { User, UserRole } from "../../entities/User";
import { IUserRepository } from "../../repositories/IUserRepository";
// @ts-ignore
import bcrypt from 'bcrypt';

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  role: UserRole;
  tenantId: string;
}

export class CreateUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<{
    success: boolean;
    data?: User;
    message?: string;
  }> {
    const existingUser = await this.userRepository.findByEmail(input.email, input.tenantId);
    if (existingUser) {
      throw new Error("User with this email already exists in this tenant");
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const response = await this.userRepository.create({
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role: input.role,
      tenantId: input.tenantId,
    });

    return {
      success: true,
      data: response,
      message: "User created successfully",
    }
  }
}