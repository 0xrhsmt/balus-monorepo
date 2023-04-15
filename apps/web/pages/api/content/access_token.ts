import { Submarine } from "pinata-submarine";
import { readContract } from "@wagmi/core";
import { lensBalusABI, lensBalusAddress } from "contracts";
import { BigNumber } from "ethers";

const submarine = new Submarine(
  process.env.SUBMARINE_API_KEY,
  process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL
);

const post = async (req, res) => {
  const id = req.body.id;

  const event = await readContract({
    address: lensBalusAddress[80001],
    abi: lensBalusABI,
    functionName: "events",
    args: [BigNumber.from(id)],
  });

  console.log("event", event.descriptionCid)
  const description = await submarine.getSubmarinedContentByCid(event.descriptionCid)


  const url = "https://managed.mypinata.cloud/api/v1/auth/content/jwt";
  const headers = {
    "x-api-key": process.env.SUBMARINE_API_KEY,
    "Content-Type": "application/json",
  };

  const data = JSON.stringify({
    timeoutSeconds: 3600,
    contentIds: [description.items[0].id, description.items[0].metadata.contentId, description.items[0].metadata.imageId],
  });
  const params = { method: "POST", headers, body: data };
  const response = await fetch(url, params);
  const token = await response.json();

  res.status(201).json({
    accessToken: token
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
