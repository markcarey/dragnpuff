import {
  Button,
  Container,
  Text,
  Heading,
  Image,
  Box,
  Link,
  Skeleton,
  Center,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  extendTheme
} from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { waitForTransactionReceipt } from '@wagmi/core'
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import nftJson from './DragNPuff.json';
import minterJson from './ERC721Minter.json';
import erc20Json from './IERC20.json';
import { m, motion } from 'framer-motion';
import { css } from '@emotion/react';

    //"@rainbow-me/rainbowkit": "^0.4.1",

// production:
//const DRAGN_CONTRACT = '0xCe68d1Fe77F5B5A37b86E2ae50cd313819C600B7';
//const MINTER_ADDRESS = '0xb2fc8E0EaF45525A51A95Cce4D3770F810Be0299';
const NOM_CONTRACT = "0x6776caCcFDCD0dFD5A38cb1D0B3b39A4Ca9283cE";

//testing:
const DRAGN_CONTRACT = '0x0946fC47Ee77d3d6ED62dcd5d1115f6153E7Eb84';
const MINTER_ADDRESS = '0x6fB0F96Bb2dCD32388eBBB6b13608928Ed538218';

const getOpenSeaURL = (tokenId: string | number) =>
  `https://opensea.io/assets/base/${DRAGN_CONTRACT}/${tokenId}`;

const getThumbURL = (tokenId: string | number) =>
  `https://api.dragnpuff.xyz/thumbs/1024/${tokenId}.png`;


function App() {

  const [imgURL, setImgURL] = useState('');

  //setImgURL('https://dragnpuff.xyz/img/dragnpuff.gif');

  //const { writeAsync: mint, error: mintError } = useWriteContract({
  //  ...minterConfig,
  //  functionName: 'mint',
  //});
  //const { writeAsync: mintBatch, error: mintBatchError } = useWriteContract({
  //  ...minterConfig,
  //  functionName: 'mintBatch',
  //});
  const { status, error, data: hash, isPending, writeContract } = useWriteContract()

  const [mintLoading, setMintLoading] = useState(false);
  const { address } = useAccount();
  const isConnected = !!address;
  const [mintedTokenId, setMintedTokenId] = useState<number>();
  const [quantity, setQuantity] = useState<number>();
  const [hasNom, setHasNom] = useState(false);

  const { data: balanceOf } = useReadContract({
    address: NOM_CONTRACT,
    abi: erc20Json.abi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: isConnected,
    },
  });

  const { data: receipt} = useWaitForTransactionReceipt({
    hash
  })

  const onMintClick = async () => {
    try {
      setMintLoading(true);
      console.log('onMint: mintLoading', mintLoading);
      console.log('Minting', { address, quantity });
      var ethPrice = '0.00000069'; // TODO: chnage to 0.0069
      if (hasNom) {
        ethPrice = '0.00000042'; // TODO: change to 0.0042
      }
      var q = quantity;
      if (quantity === undefined) {
        q = 1;
      }
      var tx;
      if (q && q > 1) {
        const batchPrice = ethers.utils.parseEther(ethPrice).mul(q);
        writeContract({
          address: MINTER_ADDRESS,
          abi: minterJson.abi,
          functionName: 'mintBatch',
          args: [address, q],
          value: batchPrice.toBigInt(),
        });
      } else {
        console.log('Ready to writeContract for 1: Minting', { address, q });
        console.log('...with price', ethers.utils.parseEther(ethPrice));
        // ethPrice converted to type BigInt:
        const mintPrice = ethers.utils.parseEther(ethPrice).toBigInt();
        console.log('...with price', mintPrice);
        try {
          writeContract({
            address: MINTER_ADDRESS,
            abi: minterJson.abi,
            functionName: 'mint',
            args: [address],
            value: mintPrice,
          });
        } catch (error) {
          console.error('Error writing contract', error);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      //setMintLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      console.log('mintLoading', mintLoading);
      if (error) {
        console.log('error', error);
      }
      if (receipt) {
        console.log('useEffect TX receipt', receipt);
        const mintedTokenId = receipt.logs[0].topics[3];
        setMintedTokenId(parseInt(mintedTokenId as string));
      }
      if (balanceOf) {
        console.log('Balance of', balanceOf.toString());
        setHasNom(balanceOf > (ethers.utils.parseEther('100000')));
      }
      if (mintedTokenId) {
        setMintLoading(false);
        console.log('Minted token ID', mintedTokenId);
        //const res = await (await fetch(tokenURI as unknown as string)).json();
        //setImgURL(res.image);
        setImgURL(getThumbURL(mintedTokenId.toString()));
      } else {
        if (isConnected) {
          console.log("address", address);
          console.log('hasNom', hasNom);
          if (hasNom) {
            setImgURL('https://frm.lol/api/dragnpuff/frimg/You%20have%20100K%20%24NOM%3A%20Mint%20for%200.0042%20ETH%20each.png');
          } else {
            setImgURL('https://frm.lol/api/dragnpuff/frimg/Mint%20for%200.0069%20ETH%20each.png');
          }
        }
      }
    })();
  }, [mintedTokenId, hasNom, isConnected, receipt, balanceOf, status, mintLoading]);

  return (
    <Container 
      paddingY='10'
      display='flex'
      flexDirection='column'
      alignItems='center'
    >
    
      <ConnectButton />

      {imgURL ? (
        <Box
          marginTop='4'
        >
          <Image src={imgURL} width='' maxW='1024' />
        </Box>
      ) : (
        <Box
          marginTop='4'
        >
          <Image src='https://dragnpuff.xyz/img/dragnpuff.gif' maxW='1024' width='' />
        </Box>
      )}

      {isConnected && !mintLoading && mintedTokenId === undefined && (
        <FormControl>
            <Input 
              type="text" 
              placeholder='Enter a quantity to mint'
              onChange={e => setQuantity(parseInt(e.target.value))}
            />
        </FormControl>  
      )}

      {mintedTokenId === undefined && (
        <Button
          disabled={!isConnected || mintLoading}
          marginTop='6'
          onClick={onMintClick}
          textColor='white'
          bg='blue.500'
          _hover={{
            bg: 'blue.700',
          }}
        >
          {isConnected ? 'Mint' : 'Mint (Connect Wallet)'}
        </Button>
      )}

      {mintLoading && (
        <Text marginTop='2'>Minting... please wait</Text>
      )}

      {mintedTokenId && (
        <Text marginTop='2'>
          Mint successful! You can view your DragN{' '}
          <Link
            isExternal
            href={getOpenSeaURL(mintedTokenId)}
            color='blue'
            textDecoration='underline'
          >
            here!
          </Link>
        </Text>
      )}

    </Container>
    
  ); // return

} // App

export default App;
