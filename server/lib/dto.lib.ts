﻿import { plainToInstance, Transform, Type as TypeDecorator } from 'class-transformer';
import { applyDecorators, Type } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiPropertyOptions } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsPositive, ValidateNested } from 'class-validator';

/**
 * Factory method for constructing DTOs from objects (often from Prisma) easily.
 * class-transformer handles the heavy lifting.
 * @param type - The DTO type to transform into
 * @param input - The input data
 * @param nullReturnsEmptyObject - Don't attempt construction if input is empty. Used by some DTOs where we want to
 *  return an empty object rather than 404
 */
export function DtoFactory<T>(
    type: Type<T>,
    input: Record<string, unknown>,
    nullReturnsEmptyObject = false
): T | undefined {
    // TODO: This is stupid, we should just 404 and change any client and game code.
    if (!input) {
        if (nullReturnsEmptyObject) return {} as T;
        return undefined;
    }
    // Ignore decorators here, we don't seem to need them. They get applied when the class instance is converted
    // back to JSON by the ClassSerializerInterceptor.
    return plainToInstance(type, input, { ignoreDecorators: true });
}

/**
 * Combination of the @ApiProperty, @Type, and @ValidateNested decorators. Handles nested transformation and validation.
 * @param {Type} type - The DTO type to transform the nested data into, and document in Swagger.
 * @param {ApiPropertyOptions} swaggerOptions - Options to pass to Swagger, minus `type` and `required`.
 */
// It may be possible to use reflection to get the type but I've messed with it for hours and can't figure
// it out, leaving for now.
export function NestedDto<T>(type: Type<T>, swaggerOptions: ApiPropertyOptions = {}): PropertyDecorator {
    return applyDecorators(
        ApiProperty({ ...swaggerOptions }),
        TypeDecorator(() => type), // Note we rename the import, this is just class-transformer's @Type.
        ValidateNested()
    );
}

/**
 * Combination of the @ApiPropertyOptional, @Type, @ValidateNested and @IsOptional decorators. Handles nested
 * transformation and validation.
 * @param {Type} type - The DTO type to transform the nested data into, and document in Swagger.
 * @param {ApiPropertyOptions} swaggerOptions - Options to pass to Swagger, minus `type` and `required`.
 */
export function NestedDtoOptional<T>(type: Type<T>, swaggerOptions: ApiPropertyOptions = {}): PropertyDecorator {
    return applyDecorators(
        ApiPropertyOptional({ ...swaggerOptions }),
        TypeDecorator(() => type),
        ValidateNested(),
        IsOptional()
    );
}

export function SkipQuery(def: number): PropertyDecorator {
    return applyDecorators(
        ApiPropertyOptional({
            name: 'skip',
            type: Number,
            default: def,
            description: 'Skip this many records'
        }),
        TypeDecorator(() => Number),
        IsInt(),
        IsOptional()
    );
}

/**
 * Decorator collection for take queries
 * @param def - The default skip value
 */
export function TakeQuery(def: number): PropertyDecorator {
    return applyDecorators(
        ApiPropertyOptional({
            name: 'take',
            type: Number,
            default: def,
            description: 'Take this many records'
        }),
        TypeDecorator(() => Number),
        IsPositive(),
        IsOptional()
    );
}

/**
 * Transform comma-separared DB expansion strings into <string, bool> record for Prisma, and set Swagger properties
 * @param expansions - String array of all the allowed expansions
 */
export function ExpandQueryDecorators(expansions: string[]): PropertyDecorator {
    return applyDecorators(
        ApiPropertyOptional({
            name: 'expand',
            type: String,
            enum: expansions,
            description: `Expands, comma-separated (${expansions.join(', ')}))`
        }),
        Transform(({ value }) => value.split(',').filter((exp) => expansions.includes(exp))),
        IsArray(),
        IsOptional()
    );
}

/**
 * Transform an array of expansion strings into Prisma includes e.g. { foo: true, bar: true, ... }
 * @param expansions - String array of all the allowed expansions
 * */
export function ExpandToPrismaIncludes(expansions: string[]): Record<string, boolean> | undefined {
    if (!expansions || !Array.isArray(expansions)) return undefined;

    const includes: Record<string, boolean> = {};
    for (const expansion of expansions) includes[expansion] = true;
    return includes;
}