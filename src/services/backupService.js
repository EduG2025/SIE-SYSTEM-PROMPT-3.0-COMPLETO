
const { 
    User, Module, ApiKey, Plan, Politician, Employee, Company, 
    Contract, Lawsuit, SocialPost, TimelineEvent, SystemSetting,
    DashboardData
} = require('../models');

const generateMysqlDump = async (dbName = 'sie_datalake') => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let sql = `-- S.I.E. 3.0.3 - MySQL Complete Backup
-- Generated at: ${timestamp}
-- Database: ${dbName}

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

`;

    // Helpers
    const escape = (str) => str === null || str === undefined ? 'NULL' : `'${String(str).replace(/'/g, "\\'")}'`;
    const json = (obj) => obj === null || obj === undefined ? 'NULL' : `'${JSON.stringify(obj).replace(/'/g, "\\'")}'`;
    const date = (d) => d ? `'${new Date(d).toISOString().slice(0, 19).replace('T', ' ')}'` : 'NULL';
    const bool = (b) => b ? 1 : 0;

    // 1. Plans
    const plans = await Plan.findAll();
    if (plans.length > 0) {
        sql += `\n-- Table: plans\nINSERT INTO \`plans\` (\`id\`, \`name\`, \`features\`, \`modules\`, \`request_limit\`, \`price\`, \`active\`, \`created_at\`, \`updated_at\`) VALUES\n`;
        sql += plans.map(p => 
            `(${escape(p.id)}, ${escape(p.name)}, ${json(p.features)}, ${json(p.modules)}, ${p.requestLimit}, ${p.price}, ${bool(p.active)}, ${date(p.createdAt)}, ${date(p.updatedAt)})`
        ).join(',\n') + ';\n';
    }

    // 2. Users
    const users = await User.findAll();
    if (users.length > 0) {
        sql += `\n-- Table: users\nINSERT INTO \`users\` (\`id\`, \`username\`, \`email\`, \`password\`, \`role\`, \`status\`, \`plan_id\`, \`avatar_url\`, \`api_key\`, \`created_at\`, \`updated_at\`) VALUES\n`;
        sql += users.map(u => 
            `(${u.id}, ${escape(u.username)}, ${escape(u.email)}, ${escape(u.password)}, ${escape(u.role)}, ${escape(u.status)}, ${escape(u.planId)}, ${escape(u.avatarUrl)}, ${escape(u.apiKey)}, ${date(u.createdAt)}, ${date(u.updatedAt)})`
        ).join(',\n') + ';\n';
    }

    // 3. Modules
    const modules = await Module.findAll();
    if (modules.length > 0) {
        sql += `\n-- Table: modules\nINSERT INTO \`modules\` (\`id\`, \`name\`, \`view\`, \`icon\`, \`active\`, \`has_settings\`, \`rules\`, \`update_frequency\`, \`last_update\`, \`created_at\`, \`updated_at\`) VALUES\n`;
        sql += modules.map(m => 
            `(${escape(m.id)}, ${escape(m.name)}, ${escape(m.view)}, ${escape(m.icon)}, ${bool(m.active)}, ${bool(m.hasSettings)}, ${escape(m.rules)}, ${escape(m.updateFrequency)}, ${date(m.lastUpdate)}, ${date(m.createdAt)}, ${date(m.updatedAt)})`
        ).join(',\n') + ';\n';
    }

    // 4. Domain Data (Examples)
    const politicians = await Politician.findAll();
    if (politicians.length > 0) {
         sql += `\n-- Table: politicians\nINSERT INTO \`politicians\` (\`id\`, \`name\`, \`party\`, \`position\`, \`state\`, \`image_url\`, \`bio\`, \`salary\`, \`monitored\`, \`risks\`, \`reputation\`, \`connections\`, \`created_at\`, \`updated_at\`) VALUES\n`;
         sql += politicians.map(p => 
            `(${escape(p.id)}, ${escape(p.name)}, ${escape(p.party)}, ${escape(p.position)}, ${escape(p.state)}, ${escape(p.imageUrl)}, ${escape(p.bio)}, ${p.salary || 'NULL'}, ${bool(p.monitored)}, ${json(p.risks)}, ${json(p.reputation)}, ${json(p.connections)}, ${date(p.createdAt)}, ${date(p.updatedAt)})`
         ).join(',\n') + ';\n';
    }

    // 5. System Settings
    const settings = await SystemSetting.findAll();
    if(settings.length > 0) {
        sql += `\n-- Table: system_settings\nINSERT INTO \`system_settings\` (\`key\`, \`value\`, \`description\`, \`created_at\`, \`updated_at\`) VALUES\n`;
        sql += settings.map(s =>
            `(${escape(s.key)}, ${json(s.value)}, ${escape(s.description)}, ${date(s.createdAt)}, ${date(s.updatedAt)})`
        ).join(',\n') + ';\n';
    }

    sql += `\nSET FOREIGN_KEY_CHECKS = 1;`;
    return sql;
};

const generateJsonDump = async () => {
    const data = {
        metadata: {
            version: '3.0.3',
            timestamp: new Date().toISOString()
        },
        users: await User.findAll(),
        plans: await Plan.findAll(),
        modules: await Module.findAll(),
        system_settings: await SystemSetting.findAll(),
        api_keys: await ApiKey.findAll(),
        domain: {
            politicians: await Politician.findAll(),
            employees: await Employee.findAll(),
            companies: await Company.findAll(),
            contracts: await Contract.findAll(),
            lawsuits: await Lawsuit.findAll(),
            timeline: await TimelineEvent.findAll()
        }
    };
    return data;
};

module.exports = { generateMysqlDump, generateJsonDump };
