# Arquitetura de Banco de Dados - S.I.E. v3.1.0

O **Sistema de Investigação Estratégica (S.I.E.)** utiliza uma arquitetura de banco de dados baseada em **MySQL 8.0+**.

Esta abordagem tira proveito do tipo de dados `JSON` nativo do MySQL para armazenar estruturas de dados complexas e variáveis (como históricos de votação, grafos de conexão e metadados de redes sociais), mantendo a integridade relacional para tabelas críticas do sistema.

---

## 1. Diagrama Lógico (Resumo)

### Núcleo do Sistema
- **`users`**: Contas de acesso, senhas (hash bcrypt), roles e vínculo com plano.
- **`plans`**: Definição de planos de assinatura, limites de requisição e features.
- **`api_keys`**: Pool de chaves do Google Gemini (Sistema e Usuário).
- **`system_settings`**: Armazenamento Key-Value para configurações globais.
- **`modules`**: Registro de módulos instalados, ícones e status.

### Domínio de Inteligência (Intelligence Lake)
- **`politicians`**: Perfis políticos, riscos, conexões e patrimônio (Heavy JSON usage).
- **`companies`**: Dados de empresas, sócios e score de risco.
- **`contracts`**: Licitações e contratos públicos.
- **`employees`**: Funcionários públicos, cargos de confiança e alertas de nepotismo.
- **`lawsuits`**: Processos judiciais e partes envolvidas.
- **`timeline_events`**: Eventos unificados para a linha do tempo cronológica.
- **`social_posts`**: Monitoramento de redes sociais.
- **`dashboard_data`**: Cache estruturado dos dados do dashboard por município.

---

## 2. Definição das Tabelas (SQL)

Use o script abaixo para recriar a estrutura do banco de dados manualmente se necessário.

```sql
-- S.I.E. 3.1.0 Database Schema
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `sie_datalake` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sie_datalake`;

-- Core: Users
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
  `avatar_url` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_unique` (`username`)
) ENGINE=InnoDB;

-- Core: Plans
CREATE TABLE IF NOT EXISTS `plans` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `features` JSON DEFAULT NULL,
  `modules` JSON DEFAULT NULL,
  `request_limit` INT DEFAULT 100,
  `price` DECIMAL(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- Intelligence: Politicians
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
  `reputation` JSON,
  `connections` JSON,
  `assets` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- Intelligence: Companies
CREATE TABLE IF NOT EXISTS `companies` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `cnpj` VARCHAR(20),
  `risk_score` DECIMAL(4,2) DEFAULT 0,
  `partners` JSON,
  `alerts` JSON,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- Intelligence: Employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `position` VARCHAR(255),
  `department` VARCHAR(255),
  `appointed_by` VARCHAR(255),
  `risk_score` DECIMAL(4,2) DEFAULT 0,
  `cargo_critico` BOOLEAN DEFAULT 0,
  `alerta_nepotismo` TEXT,
  `investigation_report` LONGTEXT,
  `alerts` JSON,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- System: Modules
CREATE TABLE IF NOT EXISTS `modules` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `view_path` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(50) DEFAULT 'cube',
  `is_active` BOOLEAN DEFAULT 1,
  `has_settings` BOOLEAN DEFAULT 0,
  `rules` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- System: Settings
CREATE TABLE IF NOT EXISTS `system_settings` (
  `key` VARCHAR(100) NOT NULL,
  `value` JSON NOT NULL,
  `description` TEXT,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
```