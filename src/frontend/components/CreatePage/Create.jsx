import { useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'
import axios from 'axios'; // Import axios library
import './Create.scss';

const Create = ({ marketplace, nft }) => {
  const [image, setImage] = useState('')
  const [price, setPrice] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const uploadToPinata = async (file) => {
    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    const data = new FormData();
    data.append('file', file);

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'pinata_api_key': process.env.REACT_APP_PINATA_KEY,
          'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET
        }
      });
      console.log('Pinata response:', response.data);
      setImage(response.data.IpfsHash);
      return response.data.IpfsHash; // Return the IPFS hash
    } catch (error) {
      console.error('Pinata upload error:', error);
      throw error; // Rethrow the error to be caught elsewhere
    }
  }

  // const uploadToPinataJSON = async (file) => {
  //   const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

  //   try {
  //     const response = await axios.post(url, {
  //       headers: {
  //         'pinata_api_key': process.env.REACT_APP_PINATA_KEY,
  //         'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET,
  //       },
  //       body: {
  //         file
  //       }
  //     });
  //     console.log('Pinata response:', response.data);
  //     setImage(response.data.IpfsHash);
  //     return response.data.IpfsHash; // Return the IPFS hash
  //   } catch (error) {
  //     console.error('Pinata upload error:', error);
  //     throw error; // Rethrow the error to be caught elsewhere
  //   }
  // }

  const uploadToPinataJSON = async (file) => {
    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  
    try {
      const response = await axios.post(url, file, {
        headers: {
          'Content-Type': 'application/json', // Set Content-Type header
          'pinata_api_key': process.env.REACT_APP_PINATA_KEY,
          'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET
        }
      });
      console.log('Pinata response:', response.data);
      setImage(response.data.IpfsHash);
      return response.data.IpfsHash; // Return the IPFS hash
    } catch (error) {
      console.error('Pinata upload error:', error);
      throw error; // Rethrow the error to be caught elsewhere
    }
  }

  const uploadToIPFS = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (typeof file !== 'undefined') {
      try {
        const ipfsHash = await uploadToPinata(file);
        setImage(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      } catch (error) {
        console.log("Pinata upload error: ", error);
      }
    }
  }

  const createNFT = async () => {
    if (!image || !price || !name || !description) return
    try{
      const result = await uploadToPinataJSON(JSON.stringify({image, price, name, description}));
      mintThenList(result)
    } catch(error) {
      console.log("ipfs uri upload error: ", error)
    }
  }

  const mintThenList = async (result) => {
    const uri = `https://gateway.pinata.cloud/ipfs/${result}`;
    // mint nft 
    await(await nft.mint(uri)).wait()
    // get tokenId of new nft 
    const id = await nft.tokenCount()
    // approve marketplace to spend nft
    await(await nft.setApprovalForAll(marketplace.address, true)).wait()
    // add nft to marketplace
    const listingPrice = ethers.utils.parseEther(price.toString())
    await(await marketplace.makeItem(nft.address, id, listingPrice)).wait()
  }

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg" className='gradient-button'>
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create;