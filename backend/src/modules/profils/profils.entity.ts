import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { NiveauTier } from '../../common/enums/niveau.tier.enum';
import { User } from '../users/users.entity';

@Entity('profils')
export class Profil {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100, nullable: true })
    nom: string;

    @Column({ length: 100, nullable: true })
    prenom: string;

    @Column({ nullable: true })
    @Unique(['cin'])
    cin: string;

    @Column({ nullable: true })
    adresse_complete: string;

    @Column({ nullable: true })
    ville: string;

    @Column({ default: 0 })
    LBarakaScore: number;

    @Column({
        type: 'enum',
        enum: NiveauTier,
        default: NiveauTier.BRONZE,
    })
    palier: NiveauTier;

    @Column({ type: 'simple-array', nullable: true })
    badges: string[];

    @Column({ default: 'FRANCAIS' })
    langueInterface: string;

    @Column({ nullable: true })
    photo_profil: string;

    @Column({ type: 'date', nullable: true })
    date_naissance: Date;

    // Relation avec Utilisateur
    @OneToOne(() => User, (user) => user.profil)
    @JoinColumn()
    utilisateur: User;
}