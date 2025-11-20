const { sequelize } = require('../config/database');

// 1. Core & Auth
const User = require('./User');
const Plan = require('./Plan');
const ApiKey = require('./ApiKey');

// 2. Configuration & System
const SystemSetting = require('./SystemSetting');
const Module = require('./Module');
const UserSetting = require('./UserSetting');

// 3. Assets & Logs
const MediaFile = require('./MediaFile');
const AuditLog = require('./AuditLog');

// 4. Domain Data (Intelligence)
const Politician = require('./Politician');
const Company = require('./Company');
const Employee = require('./Employee');
const Contract = require('./Contract');
const Lawsuit = require('./Lawsuit');
const SocialPost = require('./SocialPost');
const TimelineEvent = require('./TimelineEvent');
const DashboardData = require('./DashboardData');
const HomepageContent = require('./HomepageContent');
const Post = require('./Post');

// --- Associações (Relacionamentos MySQL) ---

// User <-> Plan
User.belongsTo(Plan, { foreignKey: 'planId', as: 'Plan' });
Plan.hasMany(User, { foreignKey: 'planId' });

// User <-> Uploads
User.hasMany(MediaFile, { foreignKey: 'uploadedBy' });
MediaFile.belongsTo(User, { foreignKey: 'uploadedBy' });

// User <-> ApiKey
User.hasMany(ApiKey, { foreignKey: 'ownerId' });
ApiKey.belongsTo(User, { foreignKey: 'ownerId' });

// User <-> Settings
User.hasMany(UserSetting, { foreignKey: 'userId' });
UserSetting.belongsTo(User, { foreignKey: 'userId' });

// User <-> Posts
User.hasMany(Post, { foreignKey: 'userId' });
Post.belongsTo(User, { foreignKey: 'userId' });

// Exportação Centralizada
module.exports = {
    sequelize,
    User,
    Plan,
    ApiKey,
    SystemSetting,
    Module,
    UserSetting,
    MediaFile,
    AuditLog,
    Politician,
    Company,
    Employee,
    Contract,
    Lawsuit,
    SocialPost,
    TimelineEvent,
    DashboardData,
    HomepageContent,
    Post
};