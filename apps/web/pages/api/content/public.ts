import { Submarine } from "pinata-submarine";
import { readContract } from "@wagmi/core";
import { lensBalusABI, lensBalusAddress } from "contracts";
import { BigNumber } from "ethers";



const submarine = new Submarine(
  process.env.SUBMARINE_API_KEY,
  process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL,
);

const post = async (req, res) => {
  const id = req.body.id;

  const event = await readContract({
    address: lensBalusAddress[80001],
    abi: lensBalusABI,
    functionName: "events",
    args: [BigNumber.from(id)],
  });

  const info = await submarine.getSubmarinedContentByCid(event.descriptionCid);

  const unlockableFileIds = [info.items[0].id, info.items[0].metadata.contentId, info.items[0].metadata.imageId]

  await Promise.all(
    unlockableFileIds.map(async (fileId) => submarine.makeFilePublic(fileId))
  )

  return res.status(201).send("");
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
