import { Link } from "react-router-dom";

const BottomBar = () => {
    return(
        <nav className="bottom-bar">
            <div className="link">
                <Link to="/" className="word">钱包</Link>
                <Link to="/warning" className="word">提示</Link>
                <Link to="/my" className="word">我的</Link>
            </div>
        </nav>
    )
}

export default BottomBar;