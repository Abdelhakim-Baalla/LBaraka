import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { RoleUtilisateur } from '../common/enums/role-utilisateur.enum';
import { NiveauTier } from '../common/enums/niveau-tier.enum';

@Entity('utilisateurs')
export class Utilisateur {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    motDePasse: string;

    @Column()
    telephone: string;

    @Column({ type: 'enum', enum: RoleUtilisateur, default: RoleUtilisateur.CITOYEN })
    role: RoleUtilisateur;

    @Column({ type: 'int', default: 0 })
    lBarakaScore: number;

    @Column({ type: 'enum', enum: NiveauTier, default: NiveauTier.BRONZE })
    palier: NiveauTier;

    @Column({ default: false })
    emailVerified: boolean;

    @Column({ default: false })
    telephoneVerified: boolean;

    @CreateDateColumn()
    dateInscription: Date;
}
