import { Link } from "react-router-dom";

const BottomBar = () => {
    return(
        <nav className="bottom-bar">
            <div className="link">
                <Link to="/home" className="icon"><img src="wallet.svg" alt="wallet"></img></Link>
                <Link to="/warning" className="icon"><img src="bell.svg" alt="bell"></img></Link>
                <Link to="/my" className="icon"><img src="person.svg" alt="person"></img></Link>
            </div>
        </nav>
    )
}

export default BottomBar;