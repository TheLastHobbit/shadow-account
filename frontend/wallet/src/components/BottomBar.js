import { Link } from "react-router-dom";
import "../css/BottomBar.css"
import { useNavigate } from "react-router-dom";
import Wallet from "./Home";

const BottomBar = () => {
    const navigate = useNavigate();

    return(

            <div className="bottom-bar">
                <div className="link">
                    <Link to="/home" className="icon">
                        <img src="wallet.svg" alt="wallet" className="btn-image"></img>
                    </Link>
                    <Link to="/warning" className="icon">
                        <img src="bell.svg" alt="bell" className="btn-image"></img>
                    </Link>
                    <Link to="/my" className="icon">
                        <img src="person.svg" alt="person" className="btn-image"></img>
                    </Link>
                </div>
            </div>
    )
}

export default BottomBar;