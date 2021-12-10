const express = require("express");
const elastic = require("elasticsearch");
const app = express();
const bodyParser = app.use(express.json());

const elasticClient = elastic.Client({
  host: "localhost:9201",
});

const router = express.Router();

// Elasticsearch logging
router.use((req, res, next) => {
  elasticClient
    .index({
      index: "logs",
      body: {
        url: req.url,
        method: req.method,
      },
    })
    .then((res) => {
      console.log("Logs indexed", res);
    })
    .catch((err) => {
      console.log(err);
    });
  next();
});

// CRUD
router.post("/multi-products", async (req, res) => {
  try {
    const dataset = req.body;

    const body = dataset.flatMap((doc) => [
      { index: { _index: "belajar_express" } },
      doc,
    ]);

    const bulkResponse = await elasticClient.bulk({
      refresh: true,
      body,
    });
    console.log("bulkResponse", bulkResponse);

    if (bulkResponse.errors) {
      const erroredDocuments = [];
      // The items array has the same order of the dataset we just indexed.
      // The presence of the `error` key indicates that the operation
      // that we did for the document has failed.
      bulkResponse.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            // If the status is 429 it means that you can retry the document,
            // otherwise it's very likely a mapping error, and you should
            // fix the document before to try it again.
            status: action[operation].status,
            error: action[operation].error,
            operation: body[i * 2],
            document: body[i * 2 + 1],
          });
        }
      });
      console.log(erroredDocuments);
    }

    const result = await elasticClient.count({
      index: "belajar_express",
    });

    return res.status(200).json(result);
  } catch (error) {
    console.log("error", error);
    return res.status(500).json(error);
  }
});

router.post("/products", (req, res) => {
  elasticClient
    .index({
      index: "belajar_express",
      body: req.body,
    })
    .then((resp) => {
      return res.status(200).json({
        msg: "Data inserted!",
      });
    })
    .catch((err) => {
      return res.status(500).json({
        msg: "Error!",
        err,
      });
    });
});

router.get("/products/:id", (req, res) => {
  let query = {
    index: "belajar_express",
    id: req.params.id,
  };

  elasticClient
    .get(query)
    .then((resp) => {
      if (!resp) {
        return res.status(404).json({
          data: resp,
        });
      }
      return res.status(200).json({
        data: resp,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        msg: "Error!",
        err,
      });
    });
});

router.put("/products/:id", (req, res) => {
  elasticClient
    .update({
      index: "belajar_express",
      body: { doc: req.body },
      id: req.params.id,
    })
    .then((resp) => {
      return res.status(200).json({
        msg: "Data updated!",
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        msg: "Error!",
        err,
      });
    });
});

router.delete("/products/:id", (req, res) => {
  elasticClient
    .delete({
      index: "belajar_express",
      id: req.params.id,
    })
    .then((resp) => {
      return res.status(200).json({
        msg: "Data deleted",
      });
    })
    .catch((err) => {
      return res.status(404).json({
        msg: "Error",
        err,
      });
    });
});

router.get("/products", (req, res) => {
  let query = {
    index: "belajar_express",
  };

  if (req.query.product) query.q = `*${req.query.product}*`;

  elasticClient
    .search(query)
    .then((resp) => {
      return res.status(200).json({
        product: resp.hits.hits,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        msg: "error",
        err,
      });
    });
});

router.delete("/cleandata", async (req, res) => {
  try {
    await elasticClient.indices.delete({
      index: "belajar_express",
    });
    return res.status(200).json({
      msg: "Cleaning Data success",
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Cleaning Data failed",
      error,
    });
  }
});

module.exports = router;
