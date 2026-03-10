import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    OneToOne,
} from 'typeorm';
import { RoleUtilisateur } from '../../common/enums/role.utilisateur.enum';
import { Profil } from '../profils/profils.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false })
    motDePasse: string;

    @Column({ unique: true })
    telephone: string;

    @Column({
        type: 'enum',
        enum: RoleUtilisateur,
        default: RoleUtilisateur.CITOYEN,
    })
    role: RoleUtilisateur;

    @Column({ default: false })
    email_verified: boolean;

    @Column({ default: false })
    telephone_verified: boolean;

    @CreateDateColumn()
    dateInscription: Date;

    // Relation avec Profil
    @OneToOne(() => Profil, (profil) => profil.utilisateur, {
        cascade: true,
    })
    profil: Profil;
}