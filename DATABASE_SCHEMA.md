
# Arquitetura de Banco de Dados - S.I.E. v3.1.0

O **Sistema de Investigação Estratégica (S.I.E.)** utiliza uma arquitetura de banco de dados híbrida baseada em **MySQL 8.0+**. 

Esta abordagem combina a integridade relacional (SQL) para tabelas críticas de sistema (Usuários, Planos, Logs) com a flexibilidade de documentos (NoSQL/JSON) para dados de inteligência que variam frequentemente (Perfis Políticos, Metadados de Redes Sociais).

---

## 1. Visão Geral do Schema

O banco de dados `sie_datalake` é dividido em três camadas lógicas:

### A. Núcleo do Sistema (Core)
Responsável por autenticação, controle de acesso e configurações globais.
- **`users`**: Contas de acesso com Role-Based Access Control (RBAC).
- **`plans`**: Definição de planos de assinatura, limites de requisição e features ativas.
- **`api_keys`**: Gerenciamento de chaves de API (Google Gemini) do sistema e de usuários.
- **`system_settings`**: Armazenamento Key-Value (JSON) para configurações globais (Tema, Homepage, Prompt IA).
- **`modules`**: Registro de módulos instalados e suas regras de IA.

### B. Auditoria e Arquivos
Responsável pela segurança e rastreabilidade.
- **`audit_logs`**: Registro imutável de ações críticas (Login, Alteração de Config, Uso de IA).
- **`media_files`**: Metadados de arquivos enviados (Uploads), linkados ao armazenamento físico.

### C. Domínio de Inteligência (Intelligence Lake)
Tabelas otimizadas para armazenar dados complexos extraídos pela IA. Fazem uso extensivo do tipo de dados `JSON` do MySQL 8.
- **`politicians`**: Perfis completos, incluindo histórico de votos, conexões e evolução patrimonial (JSON).
- **`companies`**: Dados forenses de empresas, quadro societário e riscos.
- **`contracts`**: Registro de licitações e contratos públicos.
- **`employees`**: Funcionários públicos e análise de nepotismo.
- **`lawsuits`**: Processos judiciais e partes envolvidas.
- **`social_posts`**: Monitoramento de redes sociais e análise de sentimento.
- **`timeline_events`**: Eventos cronológicos unificados para a linha do tempo.

---

## 2. Dicionário de Dados (Principais Tabelas)

### `users`
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | INT (PK) | Identificador único. |
| `username` | VARCHAR | Login do usuário. |
| `role` | ENUM | 'admin', 'user', 'editor'. |
| `plan_id` | VARCHAR | FK para tabela `plans`. |
| `api_key` | TEXT | Chave de API pessoal (criptografada opcionalmente). |

### `politicians`
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | VARCHAR (PK) | Slug único (ex: 'joao-silva-prefeito'). |
| `risks` | JSON | Objeto contendo níveis de risco Judicial, Financeiro e Mídia. |
| `connections` | JSON | Array de objetos representando o grafo de conexões. |
| `assets` | JSON | Histórico de declaração de bens e cálculo de evolução. |

---

## 3. Script SQL de Instalação (`schema.sql`)

Copie o código abaixo para criar a estrutura completa no seu servidor MySQL.

```sql
-- S.I.E. 3.1.0 Database Schema
-- Target: MySQL 8.0+ or MariaDB 10.5+
-- Character Set: utf8mb4

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Database Creation
CREATE DATABASE IF NOT EXISTS `sie_datalake` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sie_datalake`;

-- 2. Core Tables

-- Plans
CREATE TABLE IF NOT EXISTS `plans` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `features` JSON DEFAULT NULL COMMENT 'Array: ["ai_analysis", "export_pdf"]',
  `modules` JSON DEFAULT NULL COMMENT 'Array: ["mod-poli", "mod-dash"]',
  `request_limit` INT DEFAULT 100,
  `price` DECIMAL(10,2) DEFAULT 0.00,
  `active` BOOLEAN DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user', 'editor') DEFAULT 'user',
  `status` ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
  `plan_id` VARCHAR(50) DEFAULT 'starter',
  `plan_expiration` DATE DEFAULT NULL,
  `api_key` TEXT DEFAULT NULL,
  `can_use_own_api_key` BOOLEAN DEFAULT 0,
  `usage_count` INT DEFAULT 0,
  `last_usage_reset` DATE DEFAULT NULL,
  `avatar_url` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`),
  UNIQUE KEY `username_unique` (`username`),
  CONSTRAINT `fk_user_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API Keys
CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `key_value` VARCHAR(255) NOT NULL,
  `status` ENUM('Ativa', 'Inativa', 'Suspensa') DEFAULT 'Ativa',
  `type` ENUM('System', 'User') DEFAULT 'System',
  `usage_count` INT DEFAULT 0,
  `last_used` TIMESTAMP NULL DEFAULT NULL,
  `owner_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_apikey_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Settings (Key-Value Store)
CREATE TABLE IF NOT EXISTS `system_settings` (
  `key` VARCHAR(100) NOT NULL,
  `value` JSON NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modules
CREATE TABLE IF NOT EXISTS `modules` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `view_path` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(50) DEFAULT 'cube',
  `active` BOOLEAN DEFAULT 1,
  `has_settings` BOOLEAN DEFAULT 0,
  `rules` TEXT DEFAULT NULL COMMENT 'JSON String of AI Prompts/Rules',
  `update_frequency` VARCHAR(50) DEFAULT '24h',
  `last_update` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Audit & Files

-- Audit Logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `level` ENUM('INFO', 'WARN', 'ERROR', 'AUDIT') DEFAULT 'INFO',
  `message` TEXT NOT NULL,
  `user` VARCHAR(100) DEFAULT 'System',
  `metadata` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Files
CREATE TABLE IF NOT EXISTS `media_files` (
  `id` CHAR(36) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100),
  `size` INT,
  `path` TEXT NOT NULL,
  `module` VARCHAR(50) DEFAULT 'system',
  `uploaded_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_media_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Intelligence Domain Tables (JSON Heavy)

-- Politicians
CREATE TABLE IF NOT EXISTS `politicians` (
  `id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `party` VARCHAR(50),
  `position` VARCHAR(100),
  `state` CHAR(2),
  `image_url` TEXT,
  `bio` TEXT,
  `salary` DECIMAL(10,2),
  `monitored` BOOLEAN DEFAULT 0,
  `risks` JSON COMMENT '{judicial, financial, media}',
  `social_media` JSON,
  `voting_history` JSON,
  `latest_news` JSON,
  `reputation` JSON,
  `connections` JSON COMMENT 'Graph nodes/edges',
  `electoral_history` JSON,
  `party_history` JSON,
  `donations` JSON,
  `assets` JSON,
  `electoral_map` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Companies
CREATE TABLE IF NOT EXISTS `companies` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `cnpj` VARCHAR(20),
  `cnae` VARCHAR(255),
  `founding_date` VARCHAR(20),
  `share_capital` DECIMAL(15,2),
  `total_contracts_value` DECIMAL(15,2) DEFAULT 0,
  `risk_score` DECIMAL(4,2) DEFAULT 0,
  `address` TEXT,
  `partners` JSON COMMENT 'Quadro Societário',
  `alerts` JSON COMMENT 'Compliance Alerts',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `position` VARCHAR(255),
  `department` VARCHAR(255),
  `appointed_by` VARCHAR(255),
  `start_date` VARCHAR(20),
  `risk_score` DECIMAL(4,2) DEFAULT 0,
  `cargo_critico` BOOLEAN DEFAULT 0,
  `alerta_nepotismo` TEXT,
  `risk_analysis` TEXT,
  `investigation_report` LONGTEXT,
  `alerts` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contracts
CREATE TABLE IF NOT EXISTS `contracts` (
  `id` VARCHAR(100) NOT NULL,
  `company_name` VARCHAR(255),
  `company_cnpj` VARCHAR(20),
  `object` TEXT,
  `value` DECIMAL(15,2) DEFAULT 0,
  `start_date` VARCHAR(20),
  `end_date` VARCHAR(20),
  `status` VARCHAR(50) DEFAULT 'Ativo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lawsuits
CREATE TABLE IF NOT EXISTS `lawsuits` (
  `id` VARCHAR(100) NOT NULL,
  `parties` TEXT,
  `involved_parties` JSON,
  `court` VARCHAR(255),
  `class` VARCHAR(255),
  `status` VARCHAR(50) DEFAULT 'Ongoing',
  `last_update` VARCHAR(20),
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social Posts
CREATE TABLE IF NOT EXISTS `social_posts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `platform` VARCHAR(50) NOT NULL,
  `author` VARCHAR(255),
  `content` TEXT,
  `sentiment` VARCHAR(50) DEFAULT 'Neutral',
  `post_date` VARCHAR(50),
  `url` TEXT,
  `metrics` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Timeline Events
CREATE TABLE IF NOT EXISTS `timeline_events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `date` VARCHAR(20) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(50),
  `icon` VARCHAR(50),
  `related_id` VARCHAR(100),
  `related_module` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dashboard Cache Data
CREATE TABLE IF NOT EXISTS `dashboard_data` (
  `municipality` VARCHAR(255) NOT NULL,
  `data` JSON NOT NULL,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`municipality`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
```
