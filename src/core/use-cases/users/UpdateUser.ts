import { User, UserRole } from "../../entities/User";
import { IUserRepository } from "../../repositories/IUserRepository";

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
}

export class UpdateUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, tenantId: string, input: UpdateUserInput): Promise<{
    success: boolean;
    data?: User;
    message?: string;
  }> {
    const response = await this.userRepository.update(id, tenantId, input);
    return {
      success: true,
      data: response,
      message: "User updated successfully",
    }
  }
}