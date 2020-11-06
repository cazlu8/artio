import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  BeforeInsert,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserGender } from './enums/user.gender.enum';
import { Event } from '../event/event.entity';
import { Role } from '../role/role.entity';

@Entity()
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @Exclude()
  @Column('varchar', { nullable: true, name: 'guid', unique: true })
  guid: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'first_name' })
  firstName?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'last_name' })
  lastName?: string;

  @ApiProperty()
  @Column('varchar', {
    length: 70,
    nullable: false,
    unique: true,
  })
  email: string;

  @ApiProperty()
  @Column('varchar', {
    length: 70,
    nullable: false,
    name: 'contact_email',
  })
  contactEmail: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'avatar_img_url' })
  avatarImgUrl?: string;

  @ApiProperty()
  @Column('varchar', { length: 2000, nullable: true, name: 'bio' })
  bio?: string;

  @ApiProperty()
  @Column('varchar', {
    length: 50,
    nullable: true,
    name: 'phone_number',
  })
  phoneNumber?: string;

  @ApiProperty()
  @Column('enum', { enum: UserGender, nullable: true, default: undefined })
  gender?: UserGender;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'company' })
  company?: string;

  @ApiProperty()
  @Column('varchar', { length: 255, nullable: true, name: 'current_position' })
  currentPosition?: string;

  @ApiProperty()
  @Column('json', {
    nullable: true,
    name: 'social_urls',
    default: new Array(0),
  })
  socialUrls?: string;

  @ApiProperty()
  @Column('boolean', { default: true, name: 'is_new' })
  isNew?: boolean;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  updateAvatarUrl() {
    this.avatarImgUrl = `${process.env.S3_BUCKET_AVATAR_PREFIX_URL}/${this.guid}.png`;
  }

  @ManyToMany(() => Event)
  @JoinTable()
  events: Event[];

  @ManyToMany(() => Role)
  @JoinTable()
  role: Role[];
}
