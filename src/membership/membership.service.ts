import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { Prisma, UsersOnCookBooks, UsersOnRecipes } from '@prisma/client';
import { AddMembersDto } from '../cookbook/dto/add-members.dto';
import { AddMembersToRecipeDto } from '../recipe/dto/add-members-to-recipe.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EditMembersDto } from '../cookbook/dto/edit-members.dto';
import { EditMembersOfRecipeDto } from '../recipe/dto/edit-members-of-recipe.dto';
import { RemoveMembersDto } from '../cookbook/dto/remove-members.dto';
import { RemoveMembersFromRecipeDto } from '../recipe/dto/remove-members-from-recipe.dto';

type IEntityType = 'cookbook' | 'recipe';

@Injectable()
export class MembershipService {

    // CONSTRUCTOR
    constructor(
        private userService: UserService,
        private prismaService: PrismaService,
    ) { }

    getMembershipTable(
        tx: Prisma.TransactionClient,
        entityType: IEntityType
    ) {
        return entityType === 'cookbook' ? tx.usersOnCookBooks : tx.usersOnRecipes;
    }

    // Get permission
    async getPermission(
        entityType: IEntityType,
        tx: Prisma.TransactionClient,
        entityId: number,
        userId: number,
        throwErrIfNoPermission?: boolean,
    ) {

        const membershipTable = this.getMembershipTable(tx, entityType);

        // Explicitly narrow the type using a conditional
        const permission =
            entityType === 'cookbook'
                ? await (membershipTable as unknown as Prisma.UsersOnCookBooksDelegate).findUnique({
                    where: { cookbookId_userId: { userId, cookbookId: entityId } },
                })
                : await (membershipTable as unknown as Prisma.UsersOnRecipesDelegate).findUnique({
                    where: { recipeId_userId: { userId, recipeId: entityId } },
                });

        if (throwErrIfNoPermission && !permission) {
            throw new BadRequestException(`User with ID ${userId} is not a member of this ${entityType}`);
        }

        return permission;
    }

    // Update the user's role if it is different from the current role
    private async updateRoleIfDifferent(
        entityType: IEntityType,
        tx: Prisma.TransactionClient,
        permission: { role: string },
        newRole: string,
        entityId: number,
        userId: number,
    ) {
        if (permission.role !== newRole) {

            entityType === 'cookbook' ?
                await tx.usersOnCookBooks.update({
                    where: { cookbookId_userId: { userId, cookbookId: entityId } },
                    data: { role: newRole },
                }) :
                await tx.usersOnRecipes.update({
                    where: { recipeId_userId: { userId, recipeId: entityId } },
                    data: { role: newRole },
                });
        }
    }

    // Add members
    async addMembers(
        entityType: IEntityType,
        currentUserId: number,
        entityId: number,
        body: AddMembersDto | AddMembersToRecipeDto,
    ) {

        // Start a transaction
        try {
            await this.prismaService.$transaction(async (tx) => {

                await Promise.all(
                    body.members.map(async ({ role, userId }) => {

                        // Assert not current user.
                        this.userService.assertNotCurrentUser(
                            currentUserId,
                            userId,
                            'You cannot edit yourself',
                        );

                        // Check if the user exists
                        await this.userService.assertUserExists(tx, userId);

                        // Get permission for user being added to check if he already exists or not
                        const perm = await this.getPermission(
                            entityType,
                            tx,
                            entityId,
                            userId
                        );

                        if (!perm) {

                            entityType === 'cookbook' ?
                                await tx.usersOnCookBooks.create({
                                    data: {
                                        cookbook: {
                                            connect: {
                                                id: entityId,
                                            }
                                        },
                                        user: {
                                            connect: {
                                                id: userId,
                                            }
                                        },
                                        role,
                                        addedBy: currentUserId,
                                    },
                                })

                                :

                                await tx.usersOnRecipes.create({
                                    data: {
                                        recipe: {
                                            connect: {
                                                id: entityId,
                                            }
                                        },
                                        user: {
                                            connect: {
                                                id: userId,
                                            }
                                        },
                                        role,
                                        addedBy: currentUserId,
                                    }
                                })
                        }
                    })
                )
            });

            // Return success message
            return { message: 'Members added successfully.' };

        } catch (error) {
            console.error('Error while adding members:', error);
            throw error;
        }
    }

    // Edit members
    // Edit members
    async editMembers(
        entityType: IEntityType,
        currentUserId: number,
        entityId: number,
        body: EditMembersDto | EditMembersOfRecipeDto,
    ) {

        try {
            await this.prismaService.$transaction(
                async (tx) => {
                    await Promise.all(
                        body.members.map(async (member) => this.updateMemberRole(
                            entityType,
                            tx,
                            currentUserId,
                            entityId,
                            member
                        ))
                    )
                }
            )
        } catch (error) {
            console.error('Error while editing members:', error);
            throw new BadRequestException('An error occurred while editing the members!');
        }

    }

    // Helper function to update a single member's role
    private async updateMemberRole(
        entityType: IEntityType,
        tx: Prisma.TransactionClient,
        currentUserId: number,
        entityId: number,
        { userId, role }: { userId: number, role: string },
    ) {

        // Check that the user is not trying to edit himself.
        this.userService.assertNotCurrentUser(
            currentUserId,
            userId,
            'You cannot edit yourself'
        );

        // Check that the user actually exists.
        await this.userService.assertUserExists(tx, userId);

        // Get the current ² for the user being edited
        const permission = await this.getPermission(
            entityType,
            tx,
            entityId,
            userId,
            true
        );

        // Update the role if needed
        await this.updateRoleIfDifferent(
            entityType,
            tx,
            permission,
            role,
            entityId,
            userId
        );

    }

    // Remove members
    async removeMembers(
        entityType: IEntityType,
        currentUserId: number,
        entityId: number,
        body: RemoveMembersDto | RemoveMembersFromRecipeDto,
    ) {

        try {
            await this.prismaService.$transaction(
                async (tx) => {
                    await Promise.all(
                        body.userIds.map(async (userId) => this.deleteMemberFromEntity(entityType, tx, currentUserId, entityId, userId))
                    )
                }
            )
        } catch (error) {
            console.error('Error while deleting members:', error);
            throw new BadRequestException('An error occurred while deleting the members!');
        }

    }


    // Helper function to delete a single member from the cookbook.
    private async deleteMemberFromEntity(
        entityType: IEntityType,
        tx: Prisma.TransactionClient,
        currentUserId: number,
        entityId: number,
        userId: number,
    ) {

        // Check that the user is not trying to delete himself.
        this.userService.assertNotCurrentUser(
            currentUserId,
            userId,
            'You can\'t delete yourself!'
        );

        // Check that the user actually exists.
        await this.userService.assertUserExists(tx, userId);

        // Get the current permission for the user being deleted in this cookbook
        const permission = await this.getPermission(entityType, tx, entityId, userId, true);

        // Delete the permission
        await this.deleteMember(entityType, tx, entityId, userId, permission);
    }

    private async deleteMember(
        entityType: IEntityType,
        tx: Prisma.TransactionClient,
        entityId: number,
        userId: number,
        permission: UsersOnCookBooks | UsersOnRecipes
    ) {

        if (!permission) {
            throw new BadRequestException(`User with ID ${userId} is not a member of this ${entityType}`);
        }

        if(entityType === 'cookbook') {
            await tx.usersOnCookBooks.delete({
                where: {
                    cookbookId_userId: {
                        cookbookId: entityId,
                        userId,
                    }
                }
            });
        } else {
            await tx.usersOnRecipes.delete({
                where: {
                    recipeId_userId: {
                        recipeId: entityId,
                        userId,
                    }
                }
            })
        }
        
    }


}
