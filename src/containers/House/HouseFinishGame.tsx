import {
  useSignAndExecuteTransactionBlock,
} from "@mysten/dapp-kit";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiTransactionBlockResponse } from "@mysten/sui.js/client";
import { bcs } from "@mysten/sui.js/bcs";
import { bls12_381 as bls } from "@noble/curves/bls12-381";
import * as curveUtils from "@noble/curves/abstract/utils";

import { PACKAGE_ID } from "../../constants";
import { HouseKeypairContext } from "./HouseKeypairContext";
import { HouseDataContext } from "./HouseDataContext";

// This component will handle the House finishing the game when triggered
export function HouseFinishGame() {

  const { mutate: execFinishGame } = useSignAndExecuteTransactionBlock();
  const [housePrivHex] = useContext(HouseKeypairContext);
  const [houseDataId] = useContext(HouseDataContext);
  const [gameId, setGameId] = useState<string>("");
  const [vrfInput, setVrfInput] = useState<number[]>([]);

  const handleNewGame = async () => {
    try {
      const houseSignedInput = bls.sign(
        new Uint8Array(vrfInput),
        curveUtils.hexToBytes(housePrivHex),
      );

      // Finish the game immediately after new game started
      const txb = new TransactionBlock();
      txb.moveCall({
        target: `${PACKAGE_ID}::single_player_satoshi::finish_game`,
        arguments: [
          txb.pure.address(gameId),
          txb.pure(bcs.vector(bcs.U8).serialize(houseSignedInput)),
          txb.object(houseDataId),
        ],
      });

      const result = await execFinishGame({
        transactionBlock: txb,
      }, {
        onError: (err) => {
          toast.error(err.message);
        }, onSuccess: (result: SuiTransactionBlockResponse) => {
          console.log("success" + result);

        }
      }
      );
      console.log(result);



    }
    catch (error) {
      console.log("error" + error);

    }
  };

  useEffect(() => {
    // Trigger the new game event when the component mounts
    handleNewGame();
  }, [housePrivHex, houseDataId]);

  return (
    <div>
      <label>
        Game ID:
        <input
          type="text"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
        />
      </label>
      <label>
        VRF Input:
        <input
          type="text"
          value={vrfInput.join(",")}
          onChange={(e) => {
            const inputs = e.target.value.split(",").map((num) => Number(num.trim()));
            setVrfInput(inputs);
          }}
        />
      </label>
      <button onClick={handleNewGame}>Finish Game</button>
    </div>
  );
}
