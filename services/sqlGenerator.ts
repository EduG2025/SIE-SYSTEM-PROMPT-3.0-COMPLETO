
import type { User, Module, ApiKey, DataSourceCategory, Politician, Employee, Company, Contract, Lawsuit, SocialPost, TimelineEvent, UserPlan } from '../types';

/**
 * Serviço responsável por converter os dados do sistema (JSON/NoSQL)
 * para scripts SQL compatíveis com MySQL 8.0+ (Suporte a JSON nativo).
 */
export const generateMysqlInstaller = (
    dbName: string = 'sie_datalake',
    data: {
        users: User[],
        modules: Module[],
        apiKeys: ApiKey[],
        dataSources: DataSourceCategory[],
        plans: UserPlan[],
        politicians: Record<string, Politician>,
        employees: Employee[],
        companies: Company[],
        contracts: Contract[],
        lawsuits: Lawsuit[],
        socialPosts: SocialPost[],
        timelineEvents: TimelineEvent[]
    }
): string => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let sql = `-- S.I.E. 3.0 - MySQL Complete Installer Script
-- Generated at: ${timestamp}
-- Target DBMS: MySQL 8.0+ / MariaDB 10.5+ (Required for JSON support)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Database Creation
CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`${dbName}\`;

-- 2. Tables Definition

-- Users Table
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` BIGINT NOT NULL,
  \`username\` VARCHAR(255) NOT NULL,
  \`password\` VARCHAR(255) DEFAULT NULL,
  \`email\` VARCHAR(255) DEFAULT NULL,
  \`role\` VARCHAR(50) NOT NULL DEFAULT 'user',
  \`status\` VARCHAR(50) DEFAULT 'Ativo',
  \`plan_id\` VARCHAR(50) DEFAULT NULL,
  \`plan_expiration\` DATE DEFAULT NULL,
  \`api_key\` TEXT DEFAULT NULL,
  \`can_use_own_api_key\` BOOLEAN DEFAULT 0,
  \`usage_count\` INT DEFAULT 0,
  \`last_usage_reset\` DATE DEFAULT NULL,
  \`avatar_url\` TEXT DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`username_unique\` (\`username\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plans Table
CREATE TABLE IF NOT EXISTS \`plans\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`features\` JSON DEFAULT NULL COMMENT 'Array of feature keys',
  \`modules\` JSON DEFAULT NULL COMMENT 'Array of module IDs',
  \`request_limit\` INT DEFAULT 100,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modules Table
CREATE TABLE IF NOT EXISTS \`modules\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`view_path\` VARCHAR(100) NOT NULL,
  \`icon\` VARCHAR(50) DEFAULT NULL,
  \`is_active\` BOOLEAN DEFAULT 1,
  \`has_settings\` BOOLEAN DEFAULT 0,
  \`rules\` TEXT DEFAULT NULL COMMENT 'JSON String of AI rules',
  \`update_frequency\` VARCHAR(50) DEFAULT NULL,
  \`last_update\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API Keys Table
CREATE TABLE IF NOT EXISTS \`api_keys\` (
  \`id\` BIGINT NOT NULL,
  \`key_value\` TEXT NOT NULL,
  \`status\` VARCHAR(50) DEFAULT 'Ativa',
  \`type\` VARCHAR(50) DEFAULT 'System',
  \`usage_count\` INT DEFAULT 0,
  \`last_used\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data Sources Table (Normalized)
CREATE TABLE IF NOT EXISTS \`data_sources\` (
  \`id\` BIGINT NOT NULL,
  \`category_name\` VARCHAR(255) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`url\` TEXT NOT NULL,
  \`type\` VARCHAR(50) DEFAULT 'Web Scraping',
  \`reliability\` VARCHAR(50) DEFAULT 'Média',
  \`is_active\` BOOLEAN DEFAULT 1,
  \`status\` VARCHAR(50) DEFAULT 'Ativa',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Politicians Table (Deep Analytics Schema)
CREATE TABLE IF NOT EXISTS \`politicians\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`party\` VARCHAR(50) DEFAULT NULL,
  \`position\` VARCHAR(100) DEFAULT NULL,
  \`state\` VARCHAR(2) DEFAULT NULL,
  \`image_url\` TEXT DEFAULT NULL,
  \`bio\` TEXT DEFAULT NULL,
  \`salary\` DECIMAL(10,2) DEFAULT NULL,
  \`monitored\` BOOLEAN DEFAULT 0,
  \`risks\` JSON DEFAULT NULL COMMENT '{judicial, financial, media}',
  \`social_media\` JSON DEFAULT NULL COMMENT '{instagram, facebook, followers}',
  \`voting_history\` JSON DEFAULT NULL COMMENT 'Array of VotingRecord',
  \`latest_news\` JSON DEFAULT NULL COMMENT 'Array of NewsItem',
  \`reputation\` JSON DEFAULT NULL COMMENT 'Array of ReputationData',
  \`connections\` JSON DEFAULT NULL COMMENT 'Array of Connection',
  \`electoral_history\` JSON DEFAULT NULL COMMENT 'Array of ElectoralHistoryEntry',
  \`party_history\` JSON DEFAULT NULL COMMENT 'Array of PartyHistoryEntry',
  \`donations\` JSON DEFAULT NULL COMMENT '{received: []}',
  \`assets\` JSON DEFAULT NULL COMMENT '{growthPercentage, declarations: []}',
  \`electoral_map\` JSON DEFAULT NULL,
  \`last_updated\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employees Table
CREATE TABLE IF NOT EXISTS \`employees\` (
  \`id\` BIGINT NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`position\` VARCHAR(255) DEFAULT NULL,
  \`department\` VARCHAR(255) DEFAULT NULL,
  \`appointed_by\` VARCHAR(255) DEFAULT NULL,
  \`start_date\` DATE DEFAULT NULL,
  \`risk_score\` DECIMAL(4,2) DEFAULT 0,
  \`risk_analysis\` TEXT DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Companies Table (Forensic Schema)
CREATE TABLE IF NOT EXISTS \`companies\` (
  \`id\` BIGINT NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`cnpj\` VARCHAR(20) DEFAULT NULL,
  \`cnae\` VARCHAR(255) DEFAULT NULL,
  \`founding_date\` DATE DEFAULT NULL,
  \`share_capital\` DECIMAL(15,2) DEFAULT NULL,
  \`risk_score\` DECIMAL(4,2) DEFAULT 0,
  \`total_contracts_value\` DECIMAL(15,2) DEFAULT 0,
  \`partners\` JSON DEFAULT NULL COMMENT 'Array of CompanyPartner',
  \`alerts\` JSON DEFAULT NULL COMMENT 'Array of CompanyAlert',
  \`address\` TEXT DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contracts Table
CREATE TABLE IF NOT EXISTS \`contracts\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`company_name\` VARCHAR(255) DEFAULT NULL,
  \`company_cnpj\` VARCHAR(20) DEFAULT NULL,
  \`object\` TEXT DEFAULT NULL,
  \`value\` DECIMAL(15,2) DEFAULT 0,
  \`start_date\` DATE DEFAULT NULL,
  \`end_date\` DATE DEFAULT NULL,
  \`status\` VARCHAR(50) DEFAULT 'Ativo',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lawsuits Table
CREATE TABLE IF NOT EXISTS \`lawsuits\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`parties_text\` TEXT DEFAULT NULL,
  \`involved_parties\` JSON DEFAULT NULL COMMENT 'Array of LawsuitParty',
  \`court\` VARCHAR(255) DEFAULT NULL,
  \`class\` VARCHAR(255) DEFAULT NULL,
  \`status\` VARCHAR(50) DEFAULT NULL,
  \`last_update\` DATE DEFAULT NULL,
  \`description\` TEXT DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social Posts Table
CREATE TABLE IF NOT EXISTS \`social_posts\` (
  \`id\` BIGINT NOT NULL,
  \`platform\` VARCHAR(50) DEFAULT NULL,
  \`author\` VARCHAR(255) DEFAULT NULL,
  \`content\` TEXT DEFAULT NULL,
  \`sentiment\` VARCHAR(50) DEFAULT NULL,
  \`post_date\` TIMESTAMP NULL DEFAULT NULL,
  \`url\` TEXT DEFAULT NULL,
  \`metrics\` JSON DEFAULT NULL COMMENT '{likes, comments, shares}',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Timeline Table
CREATE TABLE IF NOT EXISTS \`timeline_events\` (
  \`id\` BIGINT NOT NULL AUTO_INCREMENT,
  \`date\` DATE NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT DEFAULT NULL,
  \`category\` VARCHAR(50) DEFAULT NULL,
  \`icon\` VARCHAR(50) DEFAULT NULL,
  \`related_id\` VARCHAR(100) DEFAULT NULL,
  \`related_module\` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3. Data Insertion (Seeding)

`;

    // Helpers para SQL Escaping
    const escape = (str: string | undefined | null) => {
        if (str === undefined || str === null) return 'NULL';
        // Basic escaping for single quotes
        return `'${String(str).replace(/'/g, "\\'")}'`; 
    };
    const json = (obj: any) => {
        if (obj === undefined || obj === null) return 'NULL';
        return `'${JSON.stringify(obj).replace(/'/g, "\\'")}'`;
    };
    const bool = (val: boolean | undefined) => val ? 1 : 0;
    const date = (str: string | undefined) => {
        if (!str) return 'NULL';
        // Tenta formatar YYYY-MM-DD ou ISO
        try {
            const d = new Date(str);
            if(isNaN(d.getTime())) return 'NULL';
            return `'${d.toISOString().slice(0, 19).replace('T', ' ')}'`;
        } catch { return 'NULL'; }
    };

    // Plans
    if (data.plans.length > 0) {
        sql += `\n-- Plans Data\nINSERT INTO \`plans\` (\`id\`, \`name\`, \`features\`, \`modules\`, \`request_limit\`) VALUES\n`;
        sql += data.plans.map(p => 
            `(${escape(p.id)}, ${escape(p.name)}, ${json(p.features)}, ${json(p.modules)}, ${p.requestLimit})`
        ).join(',\n') + ';\n';
    }

    // Users
    if (data.users.length > 0) {
        sql += `\n-- Users Data\nINSERT INTO \`users\` (\`id\`, \`username\`, \`password\`, \`email\`, \`role\`, \`status\`, \`plan_id\`, \`plan_expiration\`, \`api_key\`, \`can_use_own_api_key\`, \`usage_count\`, \`avatar_url\`) VALUES\n`;
        sql += data.users.map(u => 
            `(${u.id}, ${escape(u.username)}, ${escape(u.password)}, ${escape(u.email)}, ${escape(u.role)}, ${escape(u.status)}, ${escape(u.planId)}, ${date(u.planExpiration)}, ${escape(u.apiKey)}, ${bool(u.canUseOwnApiKey)}, ${u.usage}, ${escape(u.avatarUrl)})`
        ).join(',\n') + ';\n';
    }

    // Modules
    if (data.modules.length > 0) {
        sql += `\n-- Modules Data\nINSERT INTO \`modules\` (\`id\`, \`name\`, \`view_path\`, \`icon\`, \`is_active\`, \`has_settings\`, \`rules\`, \`update_frequency\`) VALUES\n`;
        sql += data.modules.map(m => 
            `(${escape(m.id)}, ${escape(m.name)}, ${escape(m.view)}, ${escape(m.icon)}, ${bool(m.active)}, ${bool(m.hasSettings)}, ${escape(m.rules)}, ${escape(m.updateFrequency)})`
        ).join(',\n') + ';\n';
    }

    // Api Keys
    if (data.apiKeys.length > 0) {
        sql += `\n-- API Keys Data\nINSERT INTO \`api_keys\` (\`id\`, \`key_value\`, \`status\`, \`type\`, \`usage_count\`) VALUES\n`;
        sql += data.apiKeys.map(k => 
            `(${k.id}, ${escape(k.key)}, ${escape(k.status)}, ${escape(k.type)}, ${k.usageCount})`
        ).join(',\n') + ';\n';
    }

    // Data Sources
    const flattenedSources: any[] = [];
    data.dataSources.forEach(cat => {
        cat.sources.forEach(src => {
            flattenedSources.push({ ...src, category_name: cat.name });
        });
    });

    if (flattenedSources.length > 0) {
        sql += `\n-- Data Sources Data\nINSERT INTO \`data_sources\` (\`id\`, \`category_name\`, \`name\`, \`url\`, \`type\`, \`reliability\`, \`is_active\`, \`status\`) VALUES\n`;
        sql += flattenedSources.map(s => 
            `(${Math.floor(s.id)}, ${escape(s.category_name)}, ${escape(s.name)}, ${escape(s.url)}, ${escape(s.type)}, ${escape(s.reliability)}, ${bool(s.active)}, ${escape(s.status)})`
        ).join(',\n') + ';\n';
    }

    // Politicians
    const politicianList = Object.values(data.politicians);
    if (politicianList.length > 0) {
        sql += `\n-- Politicians Data\nINSERT INTO \`politicians\` (\`id\`, \`name\`, \`party\`, \`position\`, \`state\`, \`image_url\`, \`bio\`, \`salary\`, \`monitored\`, \`risks\`, \`social_media\`, \`voting_history\`, \`latest_news\`, \`reputation\`, \`connections\`, \`electoral_history\`, \`party_history\`, \`donations\`, \`assets\`, \`electoral_map\`) VALUES\n`;
        sql += politicianList.map(p => 
            `(${escape(p.id)}, ${escape(p.name)}, ${escape(p.party)}, ${escape(p.position)}, ${escape(p.state)}, ${escape(p.imageUrl)}, ${escape(p.bio)}, ${p.salary || 'NULL'}, ${bool(p.monitored)}, ${json(p.risks)}, ${json(p.socialMedia)}, ${json(p.votingHistory)}, ${json(p.latestNews)}, ${json(p.reputation)}, ${json(p.connections)}, ${json(p.electoralHistory)}, ${json(p.partyHistory)}, ${json(p.donations)}, ${json(p.assets)}, ${json(p.electoralMap)})`
        ).join(',\n') + ';\n';
    }

    // Companies
    if (data.companies.length > 0) {
        sql += `\n-- Companies Data\nINSERT INTO \`companies\` (\`id\`, \`name\`, \`cnpj\`, \`cnae\`, \`founding_date\`, \`share_capital\`, \`risk_score\`, \`total_contracts_value\`, \`partners\`, \`alerts\`) VALUES\n`;
        sql += data.companies.map(c => 
            `(${c.id}, ${escape(c.name)}, ${escape(c.cnpj)}, ${escape(c.cnae)}, ${date(c.foundingDate)}, ${c.shareCapital || 0}, ${c.riskScore}, ${c.totalContractsValue}, ${json(c.partners)}, ${json(c.alerts)})`
        ).join(',\n') + ';\n';
    }

    // Contracts
    if (data.contracts.length > 0) {
        sql += `\n-- Contracts Data\nINSERT INTO \`contracts\` (\`id\`, \`company_name\`, \`company_cnpj\`, \`object\`, \`value\`, \`start_date\`, \`end_date\`, \`status\`) VALUES\n`;
        sql += data.contracts.map(c =>
             `(${escape(c.id)}, ${escape(c.companyName)}, ${escape(c.companyCnpj)}, ${escape(c.object)}, ${c.value}, ${date(c.startDate)}, ${date(c.endDate)}, ${escape(c.status)})`
        ).join(',\n') + ';\n';
    }

    // Lawsuits
    if (data.lawsuits.length > 0) {
         sql += `\n-- Lawsuits Data\nINSERT INTO \`lawsuits\` (\`id\`, \`parties_text\`, \`involved_parties\`, \`court\`, \`class\`, \`status\`, \`last_update\`, \`description\`) VALUES\n`;
         sql += data.lawsuits.map(l =>
             `(${escape(l.id)}, ${escape(l.parties)}, ${json(l.involvedParties)}, ${escape(l.court)}, ${escape(l.class)}, ${escape(l.status)}, ${date(l.lastUpdate)}, ${escape(l.description)})`
         ).join(',\n') + ';\n';
    }

    sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;
    
    return sql;
};
