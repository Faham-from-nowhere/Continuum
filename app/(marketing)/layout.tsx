import { Navbar } from "./_components/navbar";

const MarketingLayout = ({
    children
} : {
    children:React.ReactNode;
}) => {
    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="flex-1 pt-40">
                {children}
            </main>
        </div>
    )
}
    
 
export default MarketingLayout;