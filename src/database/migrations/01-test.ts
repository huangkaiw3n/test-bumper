"use strict";

const MESSAGE_CLUSTERS_TABLE_NAME = "message_clusters";
const ENUM_MESSAGE_CLUSTER_STATUSES_STATUS =
  "enum_message_cluster_statuses_status";
const INDEX_LATEST_STATUS_REPORT_COUNT_ID =
  "message_clusters_latest_status_report_count_id_idx";
const INDEX_LATEST_STATUS_ENTITY_COUNT_ID =
  "message_clusters_latest_status_entity_count_id_idx";

const enumMessageClusterStatusesStatus = [
  "'blacklisted'",
  "'whitelisted'",
  "'unclassified'",
  "'hidden'",
];

// Add some comments

module.exports = {
  ENUM_MESSAGE_CLUSTER_STATUSES_STATUS,
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE TYPE ${ENUM_MESSAGE_CLUSTER_STATUSES_STATUS} AS ENUM (${enumMessageClusterStatusesStatus.join(
      ","
    )});
    `);

    await queryInterface.createTable(MESSAGE_CLUSTERS_TABLE_NAME, {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      leader_entity_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        // ensures that each cluster has a unique leader, and each entity
        // can be the leader of at most one cluster
        unique: true,
        references: {
          model: "entities",
          key: "id",
          // If the leader entity is deleted, delete the message cluster
          // since a message cluster by definition needs a leader, and we
          // have no backend business logic to promote another entity to leader
          // if the original leader is deleted. Hence, to maintain referential
          // integrity, we need to cascade the delete
          onDelete: "CASCADE",

          // Similarly, if the leader entity is updated, update the message cluster
          onUpdate: "CASCADE",
        },
      },
      entity_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      report_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      last_reported_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      latest_status: {
        type: ENUM_MESSAGE_CLUSTER_STATUSES_STATUS,
        allowNull: false,
        defaultValue: "unclassified",
      },
      latest_status_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create index for sorting message clusters by report count
    // This index speeds up queries for "WHERE latest_status = <status> ORDER BY report_count DESC"
    // for message clusters to be sorted in descending report count
    await queryInterface.addIndex(
      MESSAGE_CLUSTERS_TABLE_NAME,
      ["latest_status", { name: "report_count", order: "DESC" }, "id"],
      {
        name: INDEX_LATEST_STATUS_REPORT_COUNT_ID,
        concurrently: true,
      }
    );

    // Create index for sorting message clusters by entity count
    // This index speeds up queries for "WHERE latest_status = <status> ORDER BY entity_count DESC"
    // for message clusters to be sorted in descending entity count
    await queryInterface.addIndex(
      MESSAGE_CLUSTERS_TABLE_NAME,
      ["latest_status", { name: "entity_count", order: "DESC" }, "id"],
      {
        name: INDEX_LATEST_STATUS_ENTITY_COUNT_ID,
        concurrently: true,
      }
    );
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex(
      MESSAGE_CLUSTERS_TABLE_NAME,
      INDEX_LATEST_STATUS_REPORT_COUNT_ID,
      {
        concurrently: true,
      }
    );

    await queryInterface.removeIndex(
      MESSAGE_CLUSTERS_TABLE_NAME,
      INDEX_LATEST_STATUS_ENTITY_COUNT_ID,
      {
        concurrently: true,
      }
    );

    await queryInterface.dropTable(MESSAGE_CLUSTERS_TABLE_NAME);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS ${ENUM_MESSAGE_CLUSTER_STATUSES_STATUS};
    `);
  },
};
