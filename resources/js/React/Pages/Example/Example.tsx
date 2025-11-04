import { useEffect, useRef, useState } from "react";
import ProductList from "@app/js/React/components/ProductList/ProductList";
import Counter from "@app/js/React/components/Counter/Counter";
import ProductCreateForm from "@app/js/React/components/ProductCreateForm/ProductCreateForm";
import InputText from "../../components/InputText/InputText";
import { CounterRef } from "../../components/Counter/Counter.types";
import useListProductsApi from "../../hooks/useListProductsApi";
import Pagination from "../../components/Pagination/Pagination";

export default function Example() {

    const LIMIT = 10;

    const { loading, callProductListApi, productList, total } = useListProductsApi();

    const [page, setPage] = useState<"Counter" | "List Products">("Counter");

    const counterRef = useRef<CounterRef>(null);

    useEffect(() => {
        if (page === "Counter") {
            return;
        }

        callProductListApi(0, LIMIT);

    }, [page]);

    const createProductHandler = () => {
        callProductListApi(0, LIMIT);
    }

    const deleteProductHandler = () => {
        callProductListApi(0, LIMIT);
    }/** */

    const changeTextHandler = (value: string) => {
        console.log(value);
        counterRef.current?.set(Number(value));
    }

    const paginateChangeHandler = (page: number) => {
        callProductListApi((page - 1) * LIMIT, LIMIT);
    }

    const PageContent: React.JSX.Element =
        page === "Counter" ? (
            <div className="row g-4 justify-content-center align-items-center min-vh-50">
                <div className="col-auto d-flex justify-content-center align-items-center">
                    <Counter ref={counterRef} />
                    <InputText onChange={changeTextHandler} />
                </div>
            </div>
        ) : (
            <div className="row g-4">
                <ProductCreateForm onCreate={createProductHandler} />
                <div className="col-12 col-lg-8">
                    {
                        loading ?
                            <i className="fas fa-spinner fa-spin"></i> :
                            (
                                <div className="d-flex gap-4 flex-column">
                                    <ProductList products={productList} onDelete={deleteProductHandler} />
                                    <Pagination data={productList} onChange={paginateChangeHandler} />
                                </div>
                            )

                    }
                </div>
            </div>
        );


    return (
        <div className="row g-4">
            <ul className="nav nav-tabs mb-4 justify-content-center">
                {["Counter", "List Products"].map((item) => {
                    const classList = ["nav-link"];

                    if (page === item) {
                        classList.push("active");
                    }
                    return (
                        <li key={item} className="nav-item">
                            <button
                                className={classList.join(" ")}
                                onClick={() => setPage(item as typeof page)}
                            >
                                {item}
                            </button>
                        </li>
                    );
                })}
            </ul>
            {PageContent}
        </div>
    );
}
