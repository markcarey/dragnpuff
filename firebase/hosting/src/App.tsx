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
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import nftJson from './DragNPuff.json';
import minterJson from './ERC721Minter.json';
import erc20Json from './IERC20.json';
import { m, motion } from 'framer-motion';

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
  const nftConfig = {
    addressOrName: DRAGN_CONTRACT,
    contractInterface: nftJson.abi,
  };
  const minterConfig = {
    addressOrName: MINTER_ADDRESS,
    contractInterface: minterJson.abi,
  };
  const nomConfig = {
    addressOrName: NOM_CONTRACT,
    contractInterface: erc20Json.abi,
  };
  const { data: tokenURI } = useContractRead({
    ...nftConfig,
    functionName: 'tokenURI',
    enabled: false,
  });
  const [imgURL, setImgURL] = useState('');

  //setImgURL('https://dragnpuff.xyz/img/dragnpuff.gif');

  const { writeAsync: mint, error: mintError } = useContractWrite({
    ...minterConfig,
    functionName: 'mint',
  });
  const { writeAsync: mintBatch, error: mintBatchError } = useContractWrite({
    ...minterConfig,
    functionName: 'mintBatch',
  });
  const [mintLoading, setMintLoading] = useState(false);
  const { address } = useAccount();
  const isConnected = !!address;
  const [mintedTokenId, setMintedTokenId] = useState<number>();
  const [quantity, setQuantity] = useState<number>();
  const [hasNom, setHasNom] = useState(false);

  const { data: balanceOf } = useContractRead({
    ...nomConfig,
    functionName: 'balanceOf',
    args: [address],
    enabled: isConnected,
    onSettled(data, error) {
      console.log('Settled', { data, error });
      if (data) {
        setHasNom(data.gt(ethers.utils.parseEther('100000')));
      }
    },
  });

  const onMintClick = async () => {
    try {
      setMintLoading(true);
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
        tx = await mintBatch({
          args: [address, quantity, { value: batchPrice }],
        });
      } else {
        tx = await mint({
          args: [address, { value: ethers.utils.parseEther(ethPrice) }],
        });
      }
      const receipt = await tx.wait();
      console.log('TX receipt', receipt);
      // @ts-ignore
      const mintedTokenId = parseInt(receipt.logs[0].topics[3]);
      setMintedTokenId(mintedTokenId);
    } catch (error) {
      console.error(error);
    } finally {
      setMintLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (mintedTokenId) {
        //const res = await (await fetch(tokenURI as unknown as string)).json();
        //setImgURL(res.image);
        setImgURL(getThumbURL(mintedTokenId.toString()));
      } else {
        if (isConnected) {
          if (hasNom) {
            setImgURL('https://frm.lol/api/dragnpuff/frimg/You%20have%20100K%20%24NOM%3A%20Mint%20for%200.0042%20ETH%20each.png');
          } else {
            setImgURL('https://frm.lol/api/dragnpuff/frimg/Mint%20for%200.0069%20ETH%20each.png');
          }
        }
      }
    })();
  }, [mintedTokenId, hasNom, isConnected]);

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
          <Image src={imgURL} width='' />
        </Box>
      ) : (
        <Box
          marginTop='4'
        >
          <Image src='https://dragnpuff.xyz/img/dragnpuff.gif' width='' />
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

      {mintError && (
        <Text marginTop='4'>⛔️ Mint unsuccessful! Error message:</Text>
      )}

      {mintBatchError && (
        <Text marginTop='4'>⛔️ Mint unsuccessful! Error message:</Text>
      )}

      {mintError && (
        <pre style={{ marginTop: '8px', color: 'red' }}>
          <code>{JSON.stringify(mintError, null, ' ')}</code>
        </pre>
      )}

      {mintBatchError && (
        <pre style={{ marginTop: '8px', color: 'red' }}>
          <code>{JSON.stringify(mintBatchError, null, ' ')}</code>
        </pre>
      )}

      {mintLoading && <Text marginTop='2'>Minting... please wait</Text>}

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
    
  );
}

export default App;
