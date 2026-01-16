'use strict'

const ENTITIES_TABLE_NAME = 'entities'
const CLUSTER_ID_COLUMN = 'cluster_id'
const INDEX_CLUSTER_ID = 'entities_cluster_id_idx'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(ENTITIES_TABLE_NAME, CLUSTER_ID_COLUMN, {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: {
          tableName: 'message_clusters',
        },
        key: 'id',
        // If the message cluster is deleted, set the cluster_id of this entity to null
        onDelete: 'SET NULL',

        // If the message cluster's ID is updated, update the cluster_id of this entity
        onUpdate: 'CASCADE',
      },
    })

    // This index speeds up queries for "WHERE cluster_id = <id>" to find all message entities belonging to the given cluster
    await queryInterface.addIndex(ENTITIES_TABLE_NAME, [CLUSTER_ID_COLUMN], {
      name: INDEX_CLUSTER_ID,
      concurrently: true,
    })
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex(ENTITIES_TABLE_NAME, INDEX_CLUSTER_ID, {
      concurrently: true,
    })

    await queryInterface.removeColumn(ENTITIES_TABLE_NAME, CLUSTER_ID_COLUMN)
  },
}
