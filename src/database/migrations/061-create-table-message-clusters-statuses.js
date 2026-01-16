'use strict'

const ENUM_MESSAGE_CLUSTER_STATUSES_STATUS =
  'enum_message_cluster_statuses_status'

const MESSAGE_CLUSTER_STATUSES_TABLE_NAME = 'message_cluster_statuses'
const INDEX_MESSAGE_CLUSTER_ID_CREATED_AT =
  'message_cluster_statuses_message_cluster_id_created_at_idx'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(MESSAGE_CLUSTER_STATUSES_TABLE_NAME, {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      message_cluster_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: {
            tableName: 'message_clusters',
          },
          key: 'id',
        },
        // If the message cluster is deleted, delete the message cluster status
        onDelete: 'CASCADE',

        // If the message cluster's ID is updated, update the message cluster status
        onUpdate: 'CASCADE',
      },
      status: {
        type: ENUM_MESSAGE_CLUSTER_STATUSES_STATUS,
        allowNull: false,
        defaultValue: 'unclassified',
      },
      actor_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: {
            tableName: 'users',
          },
          key: 'id',
        },
        // Prevent user deletion as we need an audit trail wrt toggling message cluster status
        onDelete: 'RESTRICT',

        // If the user's ID is updated, update the message cluster status
        onUpdate: 'CASCADE',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })

    // Create index for sorting message cluster statuses by ID
    // This index speeds up queries for "WHERE message_cluster_id = <id> ORDER BY id DESC"
    // This enables us to see all historical statuses for a message cluster
    // sorted in descending order of creation datetime
    await queryInterface.addIndex(
      MESSAGE_CLUSTER_STATUSES_TABLE_NAME,
      ['message_cluster_id', { name: 'created_at', order: 'DESC' }],
      {
        name: INDEX_MESSAGE_CLUSTER_ID_CREATED_AT,
        concurrently: true,
      },
    )
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex(
      MESSAGE_CLUSTER_STATUSES_TABLE_NAME,
      INDEX_MESSAGE_CLUSTER_ID_CREATED_AT,
      {
        concurrently: true,
      },
    )
    await queryInterface.dropTable(MESSAGE_CLUSTER_STATUSES_TABLE_NAME)
  },
}
