import "../css/Balance.css"

const balance = (balance) => {
    // const [balance, setBalance] = useState('');
    // useEffect(() => {
        
    // })
    return(
        <div className="card" style={{maxwidth: 18+'rem'}}>
            <div class="card-header">Your total balance</div>
            <div class="card-body">
                <h2 class="card-title">{balance.message}</h2>
            </div>
        </div>
    )
}

export default balance;