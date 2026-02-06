import { User } from "../../entities/User";
import { IUserRepository } from "../../repositories/IUserRepository";

export class GetUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, tenantId: string): Promise<User | null> {
    return this.userRepository.findById(id, tenantId);
  }
}