import { v4 } from "uuid";
import {
  isRelayerResult,
  PublicationMainFocus,
  PublicationMetadataDisplayTypes,
} from "@lens-protocol/client";
import formidable from "formidable";
import { Submarine } from "pinata-submarine";
import mime from "mime-types";

const submarine = new Submarine(
  process.env.SUBMARINE_API_KEY,
  process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL
);

export const config = {
  api: {
    bodyParser: false,
  },
};

const post = async (req, res) => {
  const form = formidable({ multiples: true });
  form.parse(req, async function (err, fields, files) {
    const info = fields.info;
    const imageContent = files.imageContent;
    const textContent = fields.textContent;

    const id = v4();

    const imageExtension = mime.extension(imageContent.mimetype);
    const imageFileName = `image-content.${imageExtension}`;
    const imageRes = await submarine.uploadFileOrFolder(
      imageContent.filepath,
      imageFileName
    );
    const imageCid = imageRes.items[0].cid;
    const content = {
      version: "2.0.0",
      metadata_id: id,
      name: "balus publication",
      description: "balus publication",
      mainContentFocus: PublicationMainFocus.Image,
      content: textContent,
      media: [
        {
          item: `${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/${imageCid}`,
          type: imageContent.mimetype,
        },
      ],
      locale: "en-US",
      attributes: [
        {
          displayType: PublicationMetadataDisplayTypes.String,
          traitType: "Created with",
          value: "balus",
        },
      ],
      tags: ["balus"],
      appId: "balus",
    };

    const contentRes = await submarine.uploadJson(content, "content.json", undefined, {
      imageId: imageRes.items[0].id,
    })

    const infoJson = {
      id,
      info,
    };

    const infoRes = await submarine.uploadJson(infoJson, "info.json", undefined, {
      imageId: imageRes.items[0].id,
      contentId: contentRes.item.id,
    })

    const response = {
      infoCid: infoRes.item.cid,
      contentCid: contentRes.item.cid,
    };

    return res.status(201).json(response);
  });
};

export default (req, res) => {
  const { method } = req;

  switch (method) {
    case "POST":
      post(req, res);
      break;
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};
