const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async () => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, { from: accounts[0] })
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, { from: user2, value: balance });
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, { from: user2, value: balance });
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[4];
    let user2 = accounts[5];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");

    await instance.createStar('awesome star', starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });

    const balanceOfUser2BeforeTransaction = web3.utils.toBN(await web3.eth.getBalance(user2));

    let receipt = await instance.buyStar(starId, { from: user2, value: balance });
    let gasUsed = web3.utils.toBN(receipt.receipt.gasUsed);

    let tx = await web3.eth.getTransaction(receipt.tx);
    let gasPrice = web3.utils.toBN(tx.gasPrice);

    const balanceAfterUser2BuysStar = web3.utils.toBN(await web3.eth.getBalance(user2));

    let value = balanceOfUser2BeforeTransaction.sub(balanceAfterUser2BuysStar).sub(gasUsed.mul(gasPrice)).toString();

    assert.equal(value, starPrice.toString());
});


it('can add the star name and star symbol properly', async () => {
    // 1. create a Star with different tokenId
    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided

    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 6;
    await instance.createStar("My Star", starId, { from: user1 });

    let name = await instance.name.call();
    let symbol = await instance.symbol.call();

    assert.equal(name, "Star Notary Service");
    assert.equal(symbol, "SNS");

});

it('lets 2 users exchange stars', async () => {

    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];

    let star1name = "Star1";
    let star1Id = 7;
    let star2name = "Star2";
    let star2Id = 8;

    await instance.createStar(star1name, star1Id, { from: user1 });
    await instance.createStar(star2name, star2Id, { from: user2 });

    await instance.exchangeStars(star1Id, star2Id, { from: user1 });

    assert.equal(user1, await instance.ownerOf.call(star2Id));
    assert.equal(user2, await instance.ownerOf.call(star1Id));

});

it('lets a user transfer a star', async () => {

    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];

    let starname = "Star1";
    let starId = 9;

    await instance.createStar(starname, starId, { from: user1 });
    await instance.transferStar(user2, starId, { from: user1 });

    assert.equal(user2, await instance.ownerOf.call(starId));

});

it('lookUptokenIdToStarInfo test', async () => {

    let instance = await StarNotary.deployed();
    let user1 = accounts[1];

    let starname = "Star10";
    let starId = 10;

    await instance.createStar(starname, starId, { from: user1 });
    let retrievedName = await instance.lookUptokenIdToStarInfo(starId);

    assert.equal(retrievedName, starname);

});