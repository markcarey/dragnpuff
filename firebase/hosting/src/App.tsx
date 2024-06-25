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
} from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import nftJson from './DragNPuff.json';
import minterJson from './ERC721Minter.json';
import { motion } from 'framer-motion';

const DRAGN_CONTRACT = '0xCe68d1Fe77F5B5A37b86E2ae50cd313819C600B7';
const MINTER_ADDRESS = '0xb2fc8E0EaF45525A51A95Cce4D3770F810Be0299';

const getOpenSeaURL = (tokenId: string | number) =>
  `https://opensea.io/assets/base/${DRAGN_CONTRACT}/${tokenId}`;

function App() {
  const nftConfig = {
    addressOrName: DRAGN_CONTRACT,
    contractInterface: nftJson.abi,
  };
  const minterConfig = {
    addressOrName: MINTER_ADDRESS,
    contractInterface: minterJson.abi,
  };
  const { data: tokenURI } = useContractRead({
    ...nftConfig,
    functionName: 'tokenURI',
  });
  const [imgURL, setImgURL] = useState('');

  //setImgURL('https://dragnpuff.xyz/img/dragnpuff.gif');

  const { writeAsync: mint, error: mintError } = useContractWrite({
    ...minterConfig,
    functionName: 'mint',
  });
  const [mintLoading, setMintLoading] = useState(false);
  const { address } = useAccount();
  const isConnected = !!address;
  const [mintedTokenId, setMintedTokenId] = useState<number>();

  const onMintClick = async () => {
    try {
      setMintLoading(true);
      const tx = await mint({
        args: [address, { value: ethers.utils.parseEther('0.0042') }],
      });
      const receipt = await tx.wait();
      console.log('TX receipt', receipt);
      // @ts-ignore
      const mintedTokenId = await receipt.events[0].args[2].toString();
      setMintedTokenId(mintedTokenId);
    } catch (error) {
      console.error(error);
    } finally {
      setMintLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (tokenURI) {
        const res = await (await fetch(tokenURI as unknown as string)).json();
        setImgURL(res.image);
      }
    })();
  }, [tokenURI]);

  return (
    <Container 
      paddingY='10'
      display='flex'
      flexDirection='column'
      alignItems='center'
    >

      <Heading as='h1' size='lg' marginBottom='6'>
        DragN'Puff
      </Heading>
      <Text marginBottom='6'>
        Pre-sale for holders of 100K $NOM
      </Text>

      <ConnectButton />

      {imgURL ? (
        <Box
          as={motion.div}
          borderColor='gray.200'
          borderWidth='1px'
          width='fit-content'
          marginTop='4'
          padding='6'
          shadow='md'
          rounded='lg'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Image src={imgURL} width='512px' />
        </Box>
      ) : (
        <Box
          marginTop='4'
        >
          <Image src='https://dragnpuff.xyz/img/dragnpuff.gif' width='512px' />
        </Box>
      )}

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

      {mintError && (
        <Text marginTop='4'>⛔️ Mint unsuccessful! Error message:</Text>
      )}

      {mintError && (
        <pre style={{ marginTop: '8px', color: 'red' }}>
          <code>{JSON.stringify(mintError, null, ' ')}</code>
        </pre>
      )}
      {mintLoading && <Text marginTop='2'>Minting... please wait</Text>}

      {mintedTokenId && (
        <Text marginTop='2'>
          🥳 Mint successful! You can view your NFT{' '}
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
