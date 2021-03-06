let express = require('express');
let router = express.Router();
let SnapshotController = require('./../controllers/SnapshotController.js');



/*
 * GET
 */
/*
 * Gets all snapshots from the database
 * Also has the ability to use the following URL query parameters
 * -snapshotNumber
 * -category
 * -next
 * -previous
 */
router.get('/', SnapshotController.list);

/*
 * GET
 */
/*
 * Gets the snapshot with the corresponding snapshot number
 */
router.get('/id/:id', SnapshotController.show);

/*
 * GET
 */
/*
 * Gets the snapshot with the corresponding snapshot number
 */
router.get('/:user/:timestamp', SnapshotController.show_via_details);

/*
 * POST
 */
/*
 * Creates a new snapshot by taking in a JSON object
 */

router.post('/', SnapshotController.create);

/*
 * DELETE
 */
/*
 * Deletes a snapshot with the corresponding snapshot number
 */
router.delete('/:snapshotNumber', SnapshotController.remove_via_snapshotNumber);

module.exports = router;
