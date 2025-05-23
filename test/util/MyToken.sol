pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, ERC20Burnable, ERC20Permit, Ownable {
    constructor(
        address initialOwner
    ) ERC20("MyToken", "MTK") ERC20Permit("MyToken") Ownable(initialOwner) {}

    function mint(address to, uint256 amount) public  {
        _mint(to, amount);
    }
}
