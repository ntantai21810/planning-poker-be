import { IsString, MinLength, MaxLength } from 'class-validator';

export class SubmitVoteDto {
    @IsString()
    @MinLength(1)
    @MaxLength(10)
    value: string;

    @IsString()
    participantId: string;
}
