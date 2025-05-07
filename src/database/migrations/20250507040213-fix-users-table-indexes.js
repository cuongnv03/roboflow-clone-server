"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop excessive indexes if needed
    try {
      // You might need to identify which indexes to drop based on your schema
      // For example:
      // await queryInterface.removeIndex('Users', 'some_index_name');

      // Instead of modifying username column with UNIQUE constraint,
      // we can ensure it's properly set up without adding a new index
      await queryInterface.changeColumn("Users", "username", {
        type: Sequelize.STRING(50),
        allowNull: false,
        // Don't add unique: true here if there's already a unique index
      });
    } catch (error) {
      console.error("Migration failed:", error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert changes if needed
    await queryInterface.changeColumn("Users", "username", {
      type: Sequelize.STRING(50),
      allowNull: false,
    });
  },
};
