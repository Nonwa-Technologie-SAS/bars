import { IUserRepository } from "../../repositories/IUserRepository";

export class DeleteUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, tenantId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    await this.userRepository.delete(id, tenantId);
    return {
      success: true,
      message: "User deleted successfully",
    }
  }
}